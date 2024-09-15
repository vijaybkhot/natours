const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// A delete handler function which acts as a universal delete function for all documents.
// It is called with the corresponding model as an argument and then it returns the delete function with including the input model.
// After calling that function, the delete operation on that model will be performed
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const id = req.params.id * 1;
    // const tour = tours.find((el) => el.id === id);
    const document = await Model.findByIdAndDelete(req.params.id, {});

    if (!document) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Assuming you want to update the document with data from the request body.
    // For example, updating the name of the document.
    // Object.assign(documents, req.body); // Merge the request body into the existing document object.
    // const id = req.params.id * 1;
    // const  document = documents.find((el) => el.id === id);

    // Convert the price from string to number if it exists
    if (req.body.price) req.body.price = Number(req.body.price); // For section 216 - In cases when data is input using form data. Form data automatically intakes string types only. So, we need to convert it to Number

    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

// Get one document factory handler function
// popOptions for the case where we need to populate based on certain referencing
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query; // Populate the reviews of virtual populate

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

//   }
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on TOUR (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    if (req.params.userId) filter.user = req.params.userId;
    console.log(filter);

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    // const docs = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // Send Response
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });
