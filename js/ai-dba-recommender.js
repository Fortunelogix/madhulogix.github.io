document.addEventListener('DOMContentLoaded', function () {
  var run = document.getElementById('run-rec');
  var clear = document.getElementById('clear-rec');
  var out = document.getElementById('rec-output');

  run.addEventListener('click', function () {
    run.disabled = true;
    out.innerHTML = '';
    setTimeout(function () {
      var recs = [
        'Run AWR baseline and identify top 5 SQL to tune.',
        'Schedule nightly incremental backups with verification.',
        'Apply latest CPU/PSU patch in a staged window.'
      ];
      recs.forEach(function(r){ var li = document.createElement('li'); li.textContent = r; out.appendChild(li); });
      run.disabled = false;
    }, 700);
  });

  clear.addEventListener('click', function () {
    out.innerHTML = '';
  });
});
