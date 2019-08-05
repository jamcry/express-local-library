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
exports.book_delete_get = function(req, res, next) {

  async.parallel({
    book: function(callback) {
      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(callback);
    },
    book_instances: function(callback) {
      BookInstance.find({ 'book': req.params.id })
      .exec(callback)
    },
  }, function(err, results) {
    if(err) return next(err);
    // Redirect to books catalog if book id is not found
    if(!results.book) res.redirect('/catalog/books');

    res.render('book_delete', {
      title: 'Delete Book',
      book: results.book,
      book_instances: results.book_instances
    });
  })

};

// Handle book delete on POST.
exports.book_delete_post = function(req, res, next) {
  async.parallel({
    book: function(callback) {
      Book.findById(req.body.bookid)
        .exec(callback);
    },
    book_instances: function(callback) {
      BookInstance.find({ 'book': req.body.bookid })
        .exec(callback);
    },
  }, function(err, results) {
    if(err) return next(err);
    if(results.book_instances.length > 0) {
      res.render('book_delete', {
        title: 'Delete Book',
        book: results.book,
        book_instances: results.book_instances
      });
      return;
    } else {
      Book.findByIdAndRemove(req.body.bookid, function(err) {
        if(err) return next(err);
        res.redirect('/catalog/books');
      })
    }
  })
};

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {
  async.parallel({
    book: function(callback) {
      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(callback);
    },
    authors: function(callback) { // Get all authors for form
      Author.find(callback);
    },
    genres: function(callback) { // Get all genres for form
      Genre.find(callback);
    },
  }, function(err, results) {
      if(err) return next(err);
      if(!results.book) {
        var err = new Error('Book not found!');
        err.status = 404
        return next(err);
      }
      // Mark book's genres selected
      for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
        for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
            if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                results.genres[all_g_iter].checked='true';
            }
        }
      }
      
      res.render('book_form', {
        title: 'Update Book',
        book: results.book,
        authors: results.authors,
        genres: results.genres,
      });
  })
};

// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array
  (req, res, next) => {
    if (!req.body.genre instanceof Array) {
      req.body.genre =
        typeof req.body.genre === "undefined"
          ? []
          : new Array(req.body.genre);
    }
    next();
  },

  // Validate fields
  body('title', 'Title cannot be empty').isLength({ min: 1 }).trim(),
  body('author', 'Author cannot be empty').isLength({ min: 1 }).trim(),
  body('summary', 'Summary cannot be empty').isLength({ min: 1 }).trim(),
  body('isbn', 'ISBN cannot be empty').isLength({ min: 1 }).trim(),
  // Sanitize fields
  sanitizeBody('title').escape(),
  sanitizeBody('author').escape(),
  sanitizeBody('summary').escape(),
  sanitizeBody('isbn').escape(),
  sanitizeBody('genre.*').escape(),

  // Process req after validation and sanitization
  (req, res, next) => {
    // Extract validation errors from req
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    var book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
      _id: req.params.id // Specify ID, otherwise a new ID will be assigned
    });

    // Rerender form if there are errors
    if(!errors.isEmpty()) {

      async.parallel({
        authors: function(callback) {
          Author.find(callback)
        },
        genres: function(callback) {
          Genre.find(callback)
        },
      }, function(err, result) {
        if(err) return next(err);
        
        // Mark our selected genres as checked.
        for (let i = 0; i < results.genres.length; i++) {
          if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked='true';
          }
        }
        
        res.render('book_form', {
          title: 'Update Book',
          authors: results.authors,
          genres: results.genres,
          book: book,
          errors: errors.array()
        });
        return;
      });

    } else {
      Book.findByIdAndUpdate(req.params.id, book, {}, function(err, book) {
        res.redirect(book.url);
      })
    }
  }
];
