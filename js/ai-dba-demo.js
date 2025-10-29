document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('ai-dba-form');
  var out = document.getElementById('ai-dba-result');
  var resetBtn = document.getElementById('ai-dba-reset');
  var range = document.getElementById('db_size_range');
  var number = document.getElementById('db_size_number');
  var presets = document.querySelectorAll('.preset');

  // keep range and number in sync
  range.addEventListener('input', function () { number.value = range.value; });
  number.addEventListener('input', function () { var v = Number(number.value||0); if (v<0) v=0; if (v>5000) v=5000; range.value = v; });

  presets.forEach(function(btn){
    btn.addEventListener('click', function(){
      var p = btn.getAttribute('data-preset');
      if(p==='small_perf'){ range.value=40; number.value=40; document.getElementById('version').value='19c'; setSymptoms(['slow_queries']); }
      if(p==='large_io'){ range.value=1500; number.value=1500; document.getElementById('version').value='19c'; setSymptoms(['high_io']); }
      if(p==='cpu_spike'){ range.value=400; number.value=400; document.getElementById('version').value='12c'; setSymptoms(['high_cpu']); }
    });
  });

  function setSymptoms(keys){
    document.querySelectorAll('input[name="symptom"]').forEach(function(cb){ cb.checked = keys.indexOf(cb.value) !== -1; });
  }

  function saveDemoLead(email, note) {
    try {
      var leads = JSON.parse(localStorage.getItem('demo_leads') || '[]');
      leads.push({ email: email, note: note, ts: new Date().toISOString() });
      localStorage.setItem('demo_leads', JSON.stringify(leads));
    } catch (e) {}
  }

  function animateBar(el, pct){
    el.style.width = pct + '%';
  }

  function simulateAdvice(data) {
    var score = 50; // 0..100, higher = more issues
    var steps = [], adviceLines = [], risk = 'Low';

    // size factor
    if (data.db_size_gb >= 1000) { score += 25; adviceLines.push('Large database size; check storage architecture and partitioning.'); }
    else if (data.db_size_gb >= 300) { score += 12; adviceLines.push('Medium-large DB: review I/O configuration and archiving.'); }

    // symptoms
    (data.symptoms||[]).forEach(function(s){
      if(s==='slow_queries'){ score += 20; adviceLines.push('Slow queries detected — investigate top SQL and execution plans.'); }
      if(s==='high_cpu'){ score += 22; adviceLines.push('High CPU usage — look at parallelism and CPU-bound queries.'); }
      if(s==='high_io'){ score += 24; adviceLines.push('High I/O waits — review disk performance and indexing.'); }
      if(s==='backup_fail'){ score += 10; adviceLines.push('Backup issues — verify retention and backup logs immediately.'); }
      if(s==='replication'){ score += 10; adviceLines.push('Replication lag — check network and apply/redo rates.'); }
      if(s==='security'){ score += 18; adviceLines.push('Security concerns — review patch level and access logs.'); }
    });

    // older versions add risk
    if (/11|12/.test((data.version||''))) { score += 10; adviceLines.push('Older Oracle version detected — consider patching or upgrade.'); }

    // environment factor
    if ((data.environment||'').toLowerCase() === 'production') score += 8;

    // clamp and decide risk
    score = Math.min(100, Math.max(0, score));
    if (score >= 65) risk = 'High';
    else if (score >= 40) risk = 'Medium';
    else risk = 'Low';

    // produce steps (simple heuristics)
    if (score >= 65) {
      steps = [
        'Run AWR/ASH and identify top consuming SQL; tune or rewrite top offenders.',
        'Assess I/O subsystem and implement partitioning/compression where applicable.',
        'Schedule an expert review for a deeper architecture audit.'
      ];
    } else if (score >= 40) {
      steps = [
        'Collect AWR and review top SQL and wait events.',
        'Verify SGA/PGA sizing and optimizer statistics.',
        'Check backups and retention; run integrity tests.'
      ];
    } else {
      steps = [
        'Verify optimizer stats and recent schema changes.',
        'Ensure regular backups and monitoring are in place.',
        'Run a periodic performance baseline for trend analysis.'
      ];
    }

    // build metric bars (in percentages)
    var metrics = {
      cpu: Math.min(95, 20 + (score * 0.7) | 0),
      io: Math.min(95, 15 + (score * 0.8) | 0),
      query_eff: Math.max(10, 100 - (score) | 0)
    };

    var recommend = score >= 65 || /critical|data loss|downtime/.test((data.issues||''));
    return { advice: adviceLines.join('\n\n'), steps: steps, risk: risk, metrics: metrics, recommend_expert_review: !!recommend };
  }

  function renderResult(obj, formData) {
    out.hidden = false;
    out.innerHTML = '';

    var title = document.createElement('h3'); title.textContent = 'Demo Health Check Results'; out.appendChild(title);

    var sum = document.createElement('div'); sum.className = 'result-summary';
    sum.innerHTML = '<strong>Risk:</strong> ' + obj.risk + (obj.advice ? ('<br/><br/>' + obj.advice) : '');
    out.appendChild(sum);

    var metricsWrap = document.createElement('div'); metricsWrap.className = 'health-bars';
    ['CPU load','I/O pressure','Query efficiency'].forEach(function(label, idx){
      var row = document.createElement('div'); row.className = 'bar-row';
      var lbl = document.createElement('div'); lbl.className = 'bar-label'; lbl.textContent = label;
      var bar = document.createElement('div'); bar.className = 'bar';
      var inner = document.createElement('div'); inner.className = 'bar-inner';
      bar.appendChild(inner);
      row.appendChild(lbl); row.appendChild(bar);
      metricsWrap.appendChild(row);
      // animate based on metrics
      var pct = [obj.metrics.cpu, obj.metrics.io, obj.metrics.query_eff][idx];
      setTimeout(function(){ animateBar(inner, pct); }, 60 + idx*120);
    });
    out.appendChild(metricsWrap);

    var stepsTitle = document.createElement('h4'); stepsTitle.textContent = 'Recommended Actions'; out.appendChild(stepsTitle);
    var ol = document.createElement('ol'); ol.className = 'result-steps';
    obj.steps.forEach(function(s){ var li = document.createElement('li'); li.textContent = s; ol.appendChild(li); });
    out.appendChild(ol);

    var meta = document.createElement('div'); meta.className = 'result-meta';
    meta.innerHTML = obj.recommend_expert_review ? 'We recommend an expert review. If you provided an email, a demo lead is stored locally.' : 'No immediate expert review recommended.';
    out.appendChild(meta);

    if (formData.email && obj.recommend_expert_review) {
      saveDemoLead(formData.email, 'Demo requested expert review');
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('ai-dba-submit');
    btn.disabled = true; btn.textContent = 'Analyzing (demo)...';

    var selectedSymptoms = Array.prototype.slice.call(document.querySelectorAll('input[name="symptom"]:checked')).map(function(cb){ return cb.value; });
    var payload = {
      db_size_gb: Number(document.getElementById('db_size_number').value || 0),
      version: document.getElementById('version').value,
      environment: form.environment.value,
      symptoms: selectedSymptoms,
      email: form.email.value || '',
      issues: selectedSymptoms.join(', ')
    };

    setTimeout(function () {
      var demo = simulateAdvice(payload);
      renderResult(demo, payload);
      btn.disabled = false; btn.textContent = 'Run Demo Health Check';
      out.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 700);
  });

  resetBtn.addEventListener('click', function () {
    form.reset(); range.value=50; number.value=50; out.hidden = true; out.innerHTML = '';
  });
});
