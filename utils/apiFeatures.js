class APIFeatures {
  constructor(query, queryString) {
    // Arguments - mongoose query, and the queryString we get from express
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) Filtering
    // We will destructure the this.queryString and then again wrap its contents inside an object
    const queryObj = { ...this.queryString }; // Hard copy of queryString. Because if queryObj is not a hard copy, and if we delete something from queryObj, the same thing will be deleted from this.queryString which we dont want.

    const exculdedFields = ['page', 'sort', 'limit', 'fields']; // We want to exclude these fields because we dont want them to put them inside our database query. These fields - paginate, sort, limit, fields - are not handled by database
    exculdedFields.forEach((el) => delete queryObj[el]); // Delete these fields

    // 1B) Advanced Filtering
    // {difficulty: 'easy', duration: { $gte: 5 } }   This is the expected monogoDB query using the gte operator
    // this is the url entered => api/v1/tours?duration[gte]=5&difficulty=easy
    //  this is what we get as query:  req.query => {difficulty: 'easy', duration: { gte: 5 } }
    // We are missing the $ operator before gte. So, we just add the $ operator to our queryObj wherever we encounter gte, gt, lte, lt

    let queryStr = JSON.stringify(queryObj); // Convert to string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // Add the '$' operator before gte, gt, lte, lt

    //query using above string by parsing it back to JSON
    this.query = this.query.find(JSON.parse(queryStr)); // We call the find method without the async/await. By doing so, we will get a query in return which we store back in this.query. If we had used await before this.query.find(), we would get the documents in return and we will not be able to chain other methods in the next lines of code. We want to chain sort, select and other methods before returning the final documents

    return this;
  }

  sort() {
    // 2) Sorting:
    if (this.queryString.sort) {
      // Example URL: api/v1/tours?sort=price,ratingsAverage - Sort first by price in ascending order and if there are equalities in price in any two documents then sort them using the ratingsAverage also in ascending order
      const sortBy = this.queryString.sort.split(',').join(' '); // split the req.query from ',' and join using ' '
      this.query = this.query.sort(sortBy); // this.query.sort('price ratingsAverage')
    } else {
      this.query = this.query.sort('-createdAt'); // If no sorting field given in URL, sort the dcouments based on the created time stamp
    }

    return this;
  }

  limitFields() {
    // 3) Field Limiting
    // Example URL: api/v1/tours?fields=name,duration,difficulty,price
    // This means, we want the output documents to have only the said fields and not any other fields
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); // this.query.select('name duration difficulty price')
    } else {
      this.query = this.query.select('-__v'); // If no limiting fields given, then just exclude __v field
    }

    return this;
  }

  paginate() {
    // 4) Pagination
    // Example URL: api/v1/tour?page=2&limit=10   => 1-10 = page 1, 11-20 = page 2, 21-30 = page 3. Since page 2 is requested, we need to skip the first 10 results

    const page = this.queryString.page * 1 || 1; // Extract page parameter and default to 1 if not provided
    const limit = this.queryString.limit * 1 || 100; // Extract limit parameter and default to 100 if not provided
    // page=2&limit=10   => 1-10 = page 1, 11-20 = page 2, 21-30 = page 3. Since page 2 is requested, we need to skip the first 10 results
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    this.query = this.query.skip(skip).limit(limit); // Apply skip and limit to the query

    return this;
  }
}

export default APIFeatures;
