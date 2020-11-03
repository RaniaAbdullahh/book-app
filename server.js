'use strict';
require('dotenv').config();
const
  express = require('express'),
  superagent = require('superagent'),
  pg = require('pg'),
  app = express(),
  PORT = process.env.PORT || 3000,
  client = new pg.Client(process.env.DATABASE_URL);

// -------------------------------
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: true
}));
// -------------------------------
app.get('/', getFromDatabase)
app.get('/search/new', getFormSearch)
app.post('/searches', getNewBooks)
app.get('/books/:id', showMoreDetails)
app.post('/books', addToDatabase)
app.get('*', getError)
// -------------------------------
// functions for endPoint
function getFromDatabase(req, res) {
  let sql = `select * from book;`;
  client.query(sql).then((data) => {
    res.render('pages/index', {
      bookInfo: data.rows,
      counter: data.rowCount
    });
  });
}


function getFormSearch(req, res) {
  res.render('pages/searches/new');
}

function getNewBooks(req,res){
  let searchKeyWord = req.body.inputName;
  let searchBy = req.body.search;
  console.log(searchBy)
  let urlBooks;
  if (searchBy === 'title'){
    urlBooks = `https://www.googleapis.com/books/v1/volumes?q=${searchKeyWord}+intitle`;
  }else{
    urlBooks = `https://www.googleapis.com/books/v1/volumes?q=${searchKeyWord}+inauthor`;
  }

  superagent.get(urlBooks).then(data =>{
    let result = data.body.items.map(element =>{
      console.log(element.volumeInfo)
      return new Book(element)
    });

    res.render('pages/searches/show',{bookDetails: result });
  });
}

function showMoreDetails(req, res) {
  let sql = `select * from book where id=$1;`;
  let safeValues = [req.params.id];
  client.query(sql, safeValues).then(data => {
    res.render('pages/books/show', {
      Details: data.rows[0]
    });
  });
}

function addToDatabase(req, res) {
  const allInfo = req.body;
  let sqlSend = `insert into book (author, title, ISBN, image_url, description,bookshelf) values($1, $2, $3, $4, $5,$6);`
  let sqlGet = `select * from book;`;
  const safeValues = [
    allInfo.author,
    allInfo.bookTitle,
    allInfo.ISBN,
    allInfo.thumnail,
    allInfo.description,
    allInfo.bookshelf
  ];
  client.query(sqlSend, safeValues)
  client.query(sqlGet).then(dataGet => {
    let lastItem = dataGet.rows.length - 1
    console.log(dataGet.rows[lastItem].description)
    res.render('pages/books/show', {
      Details: dataGet.rows[lastItem]
    });
  })
}

function getError(req, res) {
  res.render('pages/error');
}

// ---------------------------------------------------
// constructor function

function Book(data) {
  this.BookTitle = data.volumeInfo.title;
  this.AuthorName = findData(data.volumeInfo.authors, 'cant find author');
  this.BookDescription = findData(data.volumeInfo.description, 'cant find any description');
  // this.ISBN = findData(data.volumeInfo.industryIdentifiers[0].identifier, 'cant find isbn')
  this.thumnail = findData(data.volumeInfo.imageLinks.smallThumbnail, 'https://i.imgur.com/J5LVHEL.jpg')
  this.bookshelf = findData(data.volumeInfo.categories, 'cant find any bookshelf');
}
// helper functions


function findData(data, massege) {
  if (data) {
    return data;
  } else {
    return massege
  }
}

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`server is running`);
  });
})

