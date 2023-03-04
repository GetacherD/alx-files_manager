import express from 'express';

const app = express();

const port = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('', require('./routes/index'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
