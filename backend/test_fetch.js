fetch('http://localhost:5000/api/ragul/templates')
  .then(r => r.text())
  .then(t => console.log(t))
  .catch(e => console.error(e));
