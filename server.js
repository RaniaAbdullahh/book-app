'use strict';
require('dotenv').config();
const
  express = require('express'),
  superagent = require('superagent'),
  pg = require('pg'),
  app = express(),
  PORT = process.env.PORT || 3000,
  client = new pg.Client(process.env.DATABASE_URL),
  methodOverride = require('method-override');//new


// -------------------------------
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));//new
// -------------------------------
app.get('/', getFromDatabase)
app.get('/search/new', getFormSearch)
app.post('/searches', getNewBooks)
app.get('/books/:id', showMoreDetails)
app.post('/books', addToDatabase)
app.put('/books/:id', uppdateBook)//new for update
app.delete('/books/:id',deletData)//new for delete
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

function uppdateBook(req,res){
//   const bookId = req.params.id;
//   const {author,title,ISBN,image_url,description,bookshelf}=req.body;
//   const sql = 'UPDATE book SET author=$1,title=$2,ISBN=$3,image_url=$4,description=$5,bookshelf=$6 WHERE id=$6;';
//   const safeValues = [author,title,ISBN,image_url,description,bookshelf,bookId];
//   client.query(sql,safeValues).then(()=>{
//     res.redirect(`/`);
//   })
  const id = req.params.id
  let { bookname, bookauthor,bookdesc, bookISBN, bookcat,image_url} = req.body;
  let sql = `UPDATE book SET title=$1,author=$2,description=$3,ISBN=$4,bookshelf=$5,image_url=$6 WHERE ID =$7;`;
  let safeValues = [bookname, bookauthor, bookdesc, bookISBN , bookcat,image_url , id];
  client.query(sql, safeValues).then(() => {
    res.redirect('/');
  })

}
function deletData(req, res){
  const taskId = req.params.id;
  const sql = 'DELETE FROM book WHERE id=$1';
  client.query(sql, [taskId]).then(()=>{
    res.redirect('/');
  });
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

