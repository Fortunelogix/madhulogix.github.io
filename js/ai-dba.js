document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('ai-dba-form');
  var out = document.getElementById('ai-dba-result');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    out.style.display = 'none';
    var btn = document.getElementById('ai-dba-submit');
    btn.disabled = true;
    btn.textContent = 'Analyzing...';

    var payload = {
      db_size_gb: Number(form.db_size.value || 0),
      version: form.version.value || '',
      issues: form.issues.value || '',
      email: form.email.value || ''
    };

    try {
      var res = await fetch('/api/ai-dba-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Server error: ' + res.status);
      var json = await res.json();
      out.textContent = json.advice || json.error || 'No advice returned';
      out.style.display = 'block';

      if (payload.email && json.recommend_expert_review) {
        await fetch('/api/lead-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: payload.email, note: 'Requested free expert review via AI Health Check' })
        }).catch(()=>{});
      }
    } catch (err) {
      out.textContent = 'Error: ' + (err.message || err);
      out.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Run Health Check';
    }
  });
});
