document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('ai-dba-form');
  var out = document.getElementById('ai-dba-result');
  var resetBtn = document.getElementById('ai-dba-reset');

  function simulateAdvice(data) {
    var size = Number(data.db_size_gb || data.db_size || 0);
    var issues = (data.issues || '').toLowerCase();
    var version = (data.version || '').toLowerCase();
    var steps = [], risk = 'Low';
    var adviceLines = [];

    if (size > 500) {
      adviceLines.push('Database is large (' + size + ' GB). Investigate storage I/O, partitioning, and compression.');
      steps.push('Review tablespace usage and enable compression where feasible.');
      risk = 'Medium';
    } else {
      adviceLines.push('Database size appears small to medium.');
      steps.push('Validate SGA/PGA sizing and optimizer statistics.');
    }

    if (/slow|lag|timeout|performance/.test(issues)) {
      adviceLines.push('Symptoms indicate performance issues: likely I/O or inefficient SQL.');
      steps.unshift('Run AWR/ASH (or STATSPACK) to identify top consuming SQL statements.');
      risk = 'High';
    }

    if (/cpu|high cpu/.test(issues)) {
      adviceLines.push('High CPU utilisation reported. Look for CPU-bound queries and parallelism issues.');
      steps.push('Examine execution plans and consider query tuning or indexing.');
      risk = 'High';
    }

    if (version && /11|12/.test(version)) {
      adviceLines.push('Older Oracle version detected — recommend planning upgrades/patches.');
      steps.push('Plan upgrades/patches; test on staging first.');
    }

    if (steps.length < 3) steps.push('Verify backups and retention policies.');

    var recommend = (risk === 'High' || /critical|data loss|downtime/.test(issues));
    return { advice: adviceLines.join('\n\n'), steps: steps.slice(0,3), risk: risk, recommend_expert_review: !!recommend };
  }

  function saveDemoLead(email, note) {
    try {
      var leads = JSON.parse(localStorage.getItem('demo_leads') || '[]');
      leads.push({ email: email, note: note, ts: new Date().toISOString() });
      localStorage.setItem('demo_leads', JSON.stringify(leads));
    } catch (e) {}
  }

  function renderResult(obj, formData) {
    out.hidden = false;
    out.innerHTML = ''; // clear

    var title = document.createElement('h3');
    title.textContent = 'Demo Health Check Results';
    out.appendChild(title);

    var sum = document.createElement('div');
    sum.className = 'result-summary';
    sum.innerHTML = '<strong>Risk:</strong> ' + obj.risk + '<br/><br/>' + (obj.advice || '');
    out.appendChild(sum);

    var stepsTitle = document.createElement('h4');
    stepsTitle.textContent = 'Recommended Actions';
    out.appendChild(stepsTitle);

    var ol = document.createElement('ol');
    ol.className = 'result-steps';
    obj.steps.forEach(function (s) {
      var li = document.createElement('li');
      li.textContent = s;
      ol.appendChild(li);
    });
    out.appendChild(ol);

    var meta = document.createElement('div');
    meta.className = 'result-meta';
    meta.textContent = obj.recommend_expert_review ? 'We recommend an expert review. If you provided an email, we saved a demo lead.' : 'No immediate expert review recommended.';
    out.appendChild(meta);

    // show sample quick checks
    var quick = document.createElement('div');
    quick.style.marginTop = '12px';
    quick.innerHTML = '<strong>Quick checks:</strong> Run an AWR report, check top CPU queries, review I/O wait events.';
    out.appendChild(quick);

    // if lead
    if (formData.email && obj.recommend_expert_review) {
      saveDemoLead(formData.email, 'Demo requested expert review');
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('ai-dba-submit');
    btn.disabled = true;
    btn.textContent = 'Analyzing (demo)...';

    var data = {
      db_size_gb: Number(form.db_size.value || 0),
      version: form.version.value || '',
      issues: form.issues.value || '',
      email: form.email.value || ''
    };

    setTimeout(function () {
      var demo = simulateAdvice(data);
      renderResult(demo, data);
      btn.disabled = false;
      btn.textContent = 'Run Demo Health Check';
      // scroll to results
      out.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 700);
  });

  resetBtn.addEventListener('click', function () {
    form.reset();
    out.hidden = true;
    out.innerHTML = '';
  });
});
