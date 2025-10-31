document.addEventListener('DOMContentLoaded', function () {
  var run = document.getElementById('run-scan');
  var clear = document.getElementById('clear-scan');
  var preset = document.getElementById('scan-preset');
  var summary = document.getElementById('scan-summary');
  var results = document.getElementById('scan-results');
  var findingsList = document.getElementById('findings-list');
  var recList = document.getElementById('rec-list');
  var dl = document.getElementById('download-report');

  run.addEventListener('click', function () {
    summary.textContent = 'Running demo scan...';
    run.disabled = true;
    setTimeout(function () {
      // demo findings
      var findings = [
        { title: 'Unpatched DB kernel (demo)', severity: 'High', desc: 'Critical patch missing' },
        { title: 'Weak password policy (demo)', severity: 'Medium', desc: 'Consider stronger policy' },
        { title: 'Backup encryption not enforced (demo)', severity: 'Low', desc: 'Encrypt backups in transit and at rest' }
      ];
      findingsList.innerHTML = '';
      recList.innerHTML = '';
      findings.forEach(function(f){
        var li = document.createElement('li');
        li.innerHTML = '<strong>'+f.title+'</strong> — <em>'+f.severity+'</em><br/>'+f.desc;
        findingsList.appendChild(li);
        var r = document.createElement('li');
        r.textContent = 'Recommendation: ' + (f.severity === 'High' ? 'Immediate patch and scheduled maintenance.' : 'Review and plan remediation.');
        recList.appendChild(r);
      });
      summary.textContent = 'Scan complete — 3 findings (demo)';
      results.style.display = 'block';
      dl.style.display = 'inline-block';
      run.disabled = false;
    }, 900);
  });

  clear.addEventListener('click', function(){
    summary.textContent = 'No scan run yet.';
    results.style.display = 'none';
    findingsList.innerHTML = '';
    recList.innerHTML = '';
    dl.style.display = 'none';
  });

  dl.addEventListener('click', function(){
    alert('Download demo report — implement server-side export for production.');
  });
});
