const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let mongoose = require('mongoose');
mongoose.connect('mongodb+srv://Per:***@cluster0.4ch8y.mongodb.net/db-fcc?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});
let User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date,
});
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users', async (req, res) => {
  try {
    var user = new User({ username: req.body.username });
    await user.save();
    res.json(user);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.post('/api/users/:id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    const exercise = new Exercise({
      username: user.username,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: req.body.date
        ? new Date(req.body.date)
        : new Date(),
    });
    await exercise.save();

    const response = {
      _id: user._id,
      username: user.username,

      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    };
    res.json(response);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/api/users/:id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    const from = new Date(req.query.from || 0);
    const to = new Date(req.query.to || Date.now());
    const limit = Number(req.query.limit) || 0;

    const exercises = await Exercise
      .find({
        username: user.username,
        date: { $gte: from, $lte: to }
      })
      .limit(limit);

    const response = {
      _id: user._id,
      username: user.username,

      count: exercises.length,
      log: exercises.map(exercise => ({
        description: String(exercise.description),
        duration: Number(exercise.duration),
        date: exercise.date.toDateString(),
      })),
    };

    res.json(response);
  } catch (error) {
    res.json({ error: error.message });
  }
});
