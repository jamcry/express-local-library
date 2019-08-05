var BookInstance = require("../models/bookinstance");
var Book = require("../models/book");
const { body, validationResult, sanitizeBody } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res) {
  BookInstance.find()
    .populate("book")
    .exec(function(err, list_bookinstances) {
      if (err) return next(err);
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res) {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function(err, bookinstance) {
      if (err) return next(err);
      if (bookinstance == null) {
        var err = new Error("Book copy not found.");
        err.status = 404;
        return next(err);
      }
      res.render("bookinstance_detail", {
        title: "Copy Details",
        bookinstance: bookinstance
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res) {
  Book.find({}, "title").exec(function(err, books) {
    if (err) return next(err);
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate fields
  body("book", "Book cannot be empty")
    .isLength({ min: 1 })
    .trim(),

  body("imprint", "Imprint cannot be empty")
    .isLength({ min: 1 })
    .trim(),

  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601(),

  // Process req after validation and sanitization
  (req, res, next) => {
    console.log("came here");
    // Extract the validation errors from req
    const errors = validationResult(req);
    // Create a BookInstance object
    var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec(function(err, books) {
        if (err) return next(err);
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errrors.array(),
          bookinstance: bookinstance
        });
        return;
      });
    } else {
      bookinstance.save(function(err) {
        if (err) return next(err);
        res.redirect(bookinstance.url);
      });
    }
  }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
  bookinstance = BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function(err, instance) {
      if (err) return next(err);
      res.render("bookinstance_delete", {
        title: "Delete Book Instance",
        bookinstance: instance
      });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
  BookInstance.findByIdAndDelete(req.body.bookinstanceid, function(err) {
    if (err) return next(err);
    res.redirect("/catalog/bookinstances");
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {
  res.send("NOT IMPLEMENTED: BookInstance update GET");
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = function(req, res) {
  res.send("NOT IMPLEMENTED: BookInstance update POST");
};
