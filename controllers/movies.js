const Movie = require('../models/movie');
const NotFoundError = require('../errors/not-found-err');
const ForbiddenError = require('../errors/forbidden-err');
const BadRequestError = require('../errors/bad-request-err');

const errorMovieHandler = (err, next) => {
  if (err.name === 'CastError') {
    return next(new BadRequestError('Передан некорректный id фильма'));
  }
  return next(err);
};

module.exports.getMovies = (req, res, next) => {
  const owner = req.user._id;
  Movie.find({ owner })
    .then((movies) => res.send(movies))
    .catch(next);
};

module.exports.createMovie = (req, res, next) => {
  const dataMovie = { ...req.body, owner: req.user._id };
  Movie.create(dataMovie)
    .then((movie) => res.send(movie))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequestError('Переданы некорректные данные при добавлении фильма'));
      }
      return next(err);
    });
};

module.exports.deleteMovie = (req, res, next) => {
  Movie.findById(req.params._id)
    .orFail(() => new NotFoundError('Фильм с указанным id не найден'))
    .then((movie) => {
      if (JSON.stringify(movie.owner) !== JSON.stringify(req.user._id)) {
        return next(new ForbiddenError('Вы не можете удалить чужой фильм'));
      }
      return Movie.findByIdAndRemove(req.params._id)
        .then(() => res.send({ message: 'Фильм удален' }));
    })
    .catch((err) => {
      errorMovieHandler(err, next);
    });
};
