import multer from 'multer'; // Section 199 // Section 200 - Upload image/file
import sharp from 'sharp'; // Section 202 - Resize images
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as factory from './handlerFactory.js';

// // Section 200 - Configuring Multer - Storage
// // Definition of how we want to store our file. Definition and file name
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users'); // The first argument here is the error. null means no error.
//   },
//   filename: (req, file, cb) => {
//     // user-231345abc34dba-33232376764.jpeg -- user-user_id-timestamp.jpeg -- No chance of duplication of file name
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// Section 202 - Resizing images - Before processing the image, temporarily store image to the memory instead of file system - Change the above storage method of multer
const multerStorage = multer.memoryStorage(); // Stored file available at req.file

// Section 200 - Configuring Multer - Filter
// Goal is to check whether uploaded file is an image
// This filter can work for any kind of file, not just images. You can filter csv files as well.
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Section 199  - Image Uploads using multer
// const upload = multer({ dest: 'public/img/users' }); // If no options are given, uploade image will simply be stored in the memory and not saved anywhere to the disk
// We dont upload images into the database. We just upload images into our file system and then upload the links to them to the database
// Section 200 - Image uploader
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
// In case where there is no file uploaded - Multer doesn’t throw an error; it just skips the file handling part and doesn’t add anything to req.file.
export const uploadUserPhoto = upload.single('photo'); // Single - because we upload only one single image. 'photo' name of the field in the form or database.

// Section 202 - Resizing Images
export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; // Set this new attribute for filename. We need it to set the photo field in the userdata and also use it in updateMe route handler

  await sharp(req.file.buffer)
    .resize(500, 500) // 500, 500 => width and height.
    .toFormat('jpeg')
    .jpeg({
      quality: 90, // quality: 90 => 90 % compressed
    })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// getMe function
// Similar to getOne, but instead of getting the userId from the URL parameters, we get the userId from the current user data from the currently logged in user
// We get the data of the curretly logged in user from the authController.protect.
export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const updateMe = catchAsync(async (req, res, next) => {
  // Section 199 - Upload Images - Update

  // 1) Create error if user POSTs password data. i.e. Create error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }
  // 2) Update user document
  // The user.save() method is not the correct option in this case. Because, if we use the user.save() method,
  // there are some fields that are required which we have not filled. eg: confirmPassword.
  // Hence, we have to user User.findByIdAndUpdate

  // Also, we have to take care that the user cannot update role of the user in database.
  // For now, we only allow the user to update name and email. So, we now have to filter out
  // everything other than name and email. For that we use the filteredBody method
  // i.e. We filter out unwanted field names that are not allowed to be updated

  const filteredBody = filterObj(req.body, 'name', 'email');

  // Section 201 - Saving Image Name to Database

  if (req.file) filteredBody.photo = req.file.filename; // We only set the name of the property

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// Delete the user. We allow the user to delte their account.
// In reality, we actually do not delete the account from the database. We just hide the account from the user,
// by setting active property to false. We do so that we may use the user data in the future.
export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.',
  });
};

export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);
// Update user function only for administrators
// Do not attempt to change or update passwords with this!!! Because, passwords are supposed to be updated by admins only. findByIdAndUpdate() does not run any pre save middlewares hence no protection is provided for authorization.
export const updateUser = factory.updateOne(User);
export const deleteUser = factory.deleteOne(User);
