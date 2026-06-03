#!/usr/bin/env node

/**
 * Script para inicializar o banco de dados com dados de exemplo
 * Uso: node scripts/init-db.js
 */

const mongoose = require("mongoose");
const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const mongoDB = process.env.MONGODB_URI || "mongodb://localhost:27017/local_library";

const genres = [];
const authors = [];
const books = [];
const bookinstances = [];

main().catch((err) => {
  console.error("Erro ao inicializar banco de dados:", err);
  process.exit(1);
});

async function main() {
  console.log("Conectando ao MongoDB...");
  await mongoose.connect(mongoDB);
  console.log("Conectado com sucesso!");

  // Limpar dados existentes (opcional)
  console.log("Limpando dados existentes...");
  await Promise.all([
    Genre.deleteMany({}),
    Author.deleteMany({}),
    Book.deleteMany({}),
    BookInstance.deleteMany({}),
  ]);

  console.log("Criando gêneros...");
  await createGenres();
  console.log("Criando autores...");
  await createAuthors();
  console.log("Criando livros...");
  await createBooks();
  console.log("Criando instâncias de livros...");
  await createBookInstances();

  console.log("Banco de dados inicializado com sucesso!");
  await mongoose.connection.close();
  process.exit(0);
}

async function genreCreate(index, name) {
  const genre = new Genre({ name: name });
  await genre.save();
  genres[index] = genre;
  console.log(`  ✓ Gênero adicionado: ${name}`);
}

async function authorCreate(index, first_name, family_name, d_birth, d_death) {
  const authordetail = { first_name: first_name, family_name: family_name };
  if (d_birth != false) authordetail.date_of_birth = d_birth;
  if (d_death != false) authordetail.date_of_death = d_death;

  const author = new Author(authordetail);
  await author.save();
  authors[index] = author;
  console.log(`  ✓ Autor adicionado: ${first_name} ${family_name}`);
}

async function bookCreate(index, title, summary, isbn, author, genre) {
  const bookdetail = {
    title,
    summary,
    author,
    isbn,
  };
  if (genre != false) bookdetail.genre = genre;

  const book = new Book(bookdetail);
  await book.save();
  books[index] = book;
  console.log(`  ✓ Livro adicionado: ${title}`);
}

async function bookInstanceCreate(index, book, imprint, due_back, status) {
  const bookinstancedetail = {
    book,
    imprint,
  };
  if (due_back != false) bookinstancedetail.due_back = due_back;
  if (status != false) bookinstancedetail.status = status;

  const bookinstance = new BookInstance(bookinstancedetail);
  await bookinstance.save();
  bookinstances[index] = bookinstance;
  console.log(`  ✓ Instância de livro adicionada: ${imprint}`);
}

async function createGenres() {
  await Promise.all([
    genreCreate(0, "Fantasy"),
    genreCreate(1, "Science Fiction"),
    genreCreate(2, "French Poetry"),
  ]);
}

async function createAuthors() {
  await Promise.all([
    authorCreate(0, "Patrick", "Rothfuss", "1973-06-06", false),
    authorCreate(1, "Ben", "Bova", "1932-11-08", false),
    authorCreate(2, "Isaac", "Asimov", "1920-01-02", "1992-04-06"),
    authorCreate(3, "Bob", "Billings", false, false),
    authorCreate(4, "Jim", "Jones", "1971-12-16", false),
  ]);
}

async function createBooks() {
  await Promise.all([
    bookCreate(
      0,
      "The Name of the Wind (The Kingkiller Chronicle, #1)",
      "I have stolen princesses back from sleeping barrow kings. I burned down the town of Trebon. I have spent the night with Felurian and left with both my sanity and my life. I was expelled from the University at a younger age than most people are allowed in. I tread paths by moonlight that others fear to speak of during day. I have talked to Gods, loved women, and written songs that make the minstrels weep.",
      "9781473211896",
      authors[0],
      [genres[0]]
    ),
    bookCreate(
      1,
      "The Wise Man's Fear (The Kingkiller Chronicle, #2)",
      "Picking up the tale of Kvothe Kingkiller once again, we follow him into exile, into political intrigue, courtship, adventure, love and magic... and further along the path that has turned Kvothe, the mightiest magician of his age, a legend in his own time, into Kote, the unassuming pub landlord.",
      "9788401352836",
      authors[0],
      [genres[0]]
    ),
    bookCreate(
      2,
      "The Slow Regard of Silent Things (King Killer Chronicle)",
      "The Slow Regard of Silent Things is a fantasy novella by Patrick Rothfuss, the author of The Name of the Wind and The Wise Man's Fear.",
      "9780575095151",
      authors[0],
      [genres[0]]
    ),
    bookCreate(
      3,
      "Apes and Angels",
      "Humankind headed outward to conquer the planets, then swung around and conquered them back... Except for Venus, our planet of failure, to which organillionaire Cyril Oakes sends a single ship.",
      "9780671578626",
      authors[1],
      [genres[1]]
    ),
    bookCreate(
      4,
      "Death Wave",
      "In Ben Bova's previous novel Star Quest, Jordan Kell discovered that the an alien race was attempting to enslave all of humanity, and a dead alien came with a warning. Now the second wave of their invasion fleet is on its way, and humanity has no way of stopping it.",
      "9780671578626",
      authors[1],
      [genres[1]]
    ),
    bookCreate(
      5,
      "Foundation",
      "The Foundation series is a science fiction series by Isaac Asimov. It is set in a distant future of the Galactic Empire and the parallel story of the Foundation.",
      "9780553293357",
      authors[2],
      [genres[1]]
    ),
    bookCreate(
      6,
      "Foundation and Empire",
      "Foundation and Empire is the second novel in Isaac Asimov's Foundation series. It is set in a distant future of the Galactic Empire and the parallel story of the Foundation.",
      "9780553293364",
      authors[2],
      [genres[1]]
    ),
    bookCreate(
      7,
      "Second Foundation",
      "Second Foundation is the third novel in Isaac Asimov's Foundation series. It is set in a distant future of the Galactic Empire and the parallel story of the Foundation.",
      "9780553293371",
      authors[2],
      [genres[1]]
    ),
  ]);
}

async function createBookInstances() {
  await Promise.all([
    bookInstanceCreate(0, books[0], "London Gollancz, 2014.", false, "Available"),
    bookInstanceCreate(1, books[1], "Gollancz, 2011.", false, "Loaned"),
    bookInstanceCreate(2, books[2], "Gollancz, 2015.", false, "Loaned"),
    bookInstanceCreate(3, books[3], "New York Tom Doherty Associates, 2016.", false, "Available"),
    bookInstanceCreate(4, books[4], "New York Tom Doherty Associates, 2015.", false, "Available"),
    bookInstanceCreate(5, books[4], "New York Tom Doherty Associates, 2015.", false, "Maintenance"),
    bookInstanceCreate(6, books[4], "New York Tom Doherty Associates, 2015.", false, "Loaned"),
    bookInstanceCreate(7, books[0], "Imprint XXX2", "2025-12-30", "Loaned"),
    bookInstanceCreate(8, books[1], "Imprint XXX 3", "2025-12-30", "Available"),
    bookInstanceCreate(9, books[3], "Imprint XXX 4", false, "Available"),
  ]);
}

