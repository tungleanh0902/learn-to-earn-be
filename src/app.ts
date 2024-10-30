import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { config } from './config';
import cors from 'cors';
import { manageQuizz } from "./routes/quizz.route";

const app = express();
app.use(cors()); 
const port = 8080;
require('dotenv').config();

mongoose
    .connect(config.database, { retryWrites: true, w: 'majority' })
    .then(() => {
        console.log('Mongo connected successfully.');
    })
    .catch((error) => console.log(error));


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use("/api/quizz", manageQuizz);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
