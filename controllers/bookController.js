var Book = require("../models/book");
var Author = require("../models/author");
var Genre = require("../models/genre");
var BookInstance = require("../models/bookinstance");

var async = require("async");
const { body, validationResult, sanitizeBody } = require("express-validator");

exports.index = function(req, res) {
  async.parallel(
    {
      book_count: function(callback) {
        Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
      book_instance_count: function(callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count: function(callback) {
        BookInstance.countDocuments({ status: "Available" }, callback);
      },
      author_count: function(callback) {
        Author.countDocuments({}, callback);
      },
      genre_count: function(callback) {
        Genre.countDocuments({}, callback);
      }
    },
    function(err, results) {
      res.render("index", {
        title: "Local Library Home",
        error: err,
        data: results
      });
    }
  );
};

// Display list of all books.
exports.book_list = function(req, res) {
  Book.find({}, "title author")
    .populate("author") // Replace author _id with author details
    .exec(function(err, list_books) {
      if (err) return next(err);
      res.render("book_list", { title: "Book List", book_list: list_books });
    });
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {
  async.parallel(
    {
      book: function(callback) {
        Book.findById(req.params.id)
          .populate("author")
          .populate("genre")
          .exec(callback);
      },
      book_instance: function(callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      }
    },
    function(err, results) {
      if (err) return next(err);
      if (results.book == null) {
        var err = new Error("Book not found!");
        err.status = 404;
        return next(err);
      }
      res.render("book_detail", {
        title: results.book.title,
        book: results.book,
        book_instances: results.book_instance
      });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
  // Get all authors and genres to show on form
  async.parallel(
    {
      authors: function(callback) {
        Author.find(callback);
      },
      genres: function(callback) {
        Genre.find(callback);
      }
    },
    function(err, results) {
      if (err) return next(err);
      res.render("book_form", {
        title: "Create Book",
        authors: results.authors,
        genres: results.genres
      });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre list to an array
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },

  // Validate fields
  body("title", "Title cannot be empty")
    .isLength({ min: 1 })
    .trim(),
  body("author", "Author cannot be empty")
    .isLength({ min: 1 })
    .trim(),
  body("summary", "Summary cannot be empty")
    .isLength({ min: 10 })
    .withMessage('Summary cannot be shorter than 10 characters')
    .trim(),
  body("isbn", "ISBN cannot be empty")
    .isLength({ min: 10 })
    .withMessage('ISBN cannot be shorter than 10 characters')
    .trim(),

  // Saitize fields
  sanitizeBody("*").escape(),

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract the validation errors from req
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data
    var book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn
    });

    if (!errors.isEmpty()) {
      // Get all authors and genres for form
      async.parallel(
        {
          authors: function(callback) {
            Author.find(callback);
          },
          genres: function(callback) {
            Genre.find(callback);
          }
        },
        function(err, results) {
          if (err) return next(err);

          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = "true";
            }
          }

          res.render("book_form", {
            title: "Create Book",
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array()
          });
        }
      );
      return;
    } else {
      book.save(function(err) {
        if (err) return next(err);
        res.redirect(book.url);
      });
    }
  }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
  res.send("NOT IMPLEMENTED: Book delete GET");
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
  res.send("NOT IMPLEMENTED: Book delete POST");
};

// Display book update form on GET.
exports.book_update_get = function(req, res) {
  res.send("NOT IMPLEMENTED: Book update GET");
};

// Handle book update on POST.
exports.book_update_post = function(req, res) {
  res.send("NOT IMPLEMENTED: Book update POST");
};
