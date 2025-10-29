document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('ai-dba-form');
  var out = document.getElementById('ai-dba-result');

  function simulateAdvice(data) {
    // simple heuristics to create demo output
    var size = Number(data.db_size_gb || data.db_size || 0);
    var issues = (data.issues || '').toLowerCase();
    var version = (data.version || '').toLowerCase();
    var steps = [], risk = 'Low';
    var adviceLines = [];

    if (size > 500) {
      adviceLines.push('Database is large (' + size + ' GB). Check storage I/O and partitioning.');
      steps.push('Review tablespace usage and enable compression where feasible.');
      risk = 'Medium';
    } else {
      adviceLines.push('Database size is within small/medium range.');
      steps.push('Verify SGA/PGA sizing and optimizer statistics.');
    }

    if (/slow|lag|timeout|performance/.test(issues)) {
      adviceLines.push('Symptoms indicate performance issues: likely I/O or inefficient queries.');
      steps.push('Run AWR/ASH (or STATSPACK) and identify top consuming SQLs.');
      risk = 'High';
    }

    if (/cpu|high cpu/.test(issues)) {
      adviceLines.push('High CPU reported. Check long-running queries and CPU-bound workloads.');
      steps.push('Examine execution plans and add proper indexes or rewrite expensive queries.');
      risk = 'High';
    }

    if (version && /11|12/.test(version)) {
      adviceLines.push('Older Oracle version detected — consider patching or upgrade.');
      steps.push('Plan upgrades/patches; test on staging before production.');
    }

    if (steps.length < 3) {
      steps.push('Verify backups and retention policies.');
    }

    var recommend = (risk === 'High' || /critical|data loss|downtime/.test(issues));

    var result = {
      advice: adviceLines.join('\n\n'),
      steps: steps.slice(0,3),
      risk: risk,
      recommend_expert_review: !!recommend
    };
    return result;
  }

  function saveDemoLead(email, note) {
    try {
      var leads = JSON.parse(localStorage.getItem('demo_leads') || '[]');
      leads.push({ email: email, note: note, ts: new Date().toISOString() });
      localStorage.setItem('demo_leads', JSON.stringify(leads));
    } catch (e) {}
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    out.style.display = 'none';
    var btn = document.getElementById('ai-dba-submit');
    btn.disabled = true;
    btn.textContent = 'Analyzing (demo)...';

    var data = {
      db_size_gb: Number(form.db_size.value || 0),
      version: form.version.value || '',
      issues: form.issues.value || '',
      email: form.email.value || ''
    };

    // simulate network latency
    setTimeout(function () {
      var demo = simulateAdvice(data);
      var html = 'Advice:\n' + demo.advice + '\n\nSteps:\n';
      demo.steps.forEach(function (s, i) { html += (i+1) + '. ' + s + '\n'; });
      html += '\nRisk: ' + demo.risk + '\n';
      html += '\nRecommend expert review: ' + (demo.recommend_expert_review ? 'Yes' : 'No') + '\n\n';
      html += 'Note: This is a demo. For a live expert review, deploy the server backend.';

      out.textContent = html;
      out.style.display = 'block';

      if (data.email && demo.recommend_expert_review) {
        saveDemoLead(data.email, 'Requested demo expert review');
      }

      btn.disabled = false;
      btn.textContent = 'Run Demo Health Check';
    }, 800);
  });
});
