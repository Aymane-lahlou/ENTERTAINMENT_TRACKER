alert("Get out");
const url = 'https://api.themoviedb.org/3/account/21566186';
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0MWFjMDA3ODEzYzljZDdhZGI5Yjk3ODI3OTM4ZGM1NyIsIm5iZiI6MTcyODY4OTExMC42OTgsInN1YiI6IjY3MDliM2Q2OTU2NzhlMzUzZjcyNmVkYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Nrv2oij7zmzM4cA4nNfSNydlA0uFR67A6GHoJaC5Mfs'
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error(err));