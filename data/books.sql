DROP TABLE IF EXISTS book;

CREATE TABLE IF NOT EXISTS book (
    id SERIAL PRIMARY KEY,
    author VARCHAR(255),
    title TEXT,
    ISBN VARCHAR(255),
    image_url TEXT,
    description TEXT,
    bookshelf VARCHAR(255)
);

