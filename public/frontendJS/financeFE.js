document.addEventListener('DOMContentLoaded', () => {
    const userId = window.userId || (function getCookie(name){
        const cookies = document.cookie.split("; ");
        for (let c of cookies) { const [n,v] = c.split("="); if (n===name) return decodeURIComponent(v); }
        return null;
    })("userId");

    const form = document.getElementById('financeForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const type = document.getElementById('type').value;
            const amount = document.getElementById('amount').value;
            const category = document.getElementById('category').value;
            const date = document.getElementById('date').value;
            const note = document.getElementById('note').value;

            try {
                const res = await fetch(`/finance/${userId}/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, amount, category, date, note })
                });
                if (!res.ok) throw new Error('Failed to add log');
                window.location.reload();
            } catch (err) {
                console.error(err);
                alert('Could not save entry');
            }
        });
    }

    document.querySelectorAll('.delete-log').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Delete this entry?')) return;
            try {
                const res = await fetch(`/finance/${userId}/delete`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                if (!res.ok) throw new Error('Failed to delete');
                window.location.reload();
            } catch (err) {
                console.error(err);
                alert('Could not delete entry');
            }
        });
    });

    // Enforce dark styling on dynamically updated elements if needed
    document.querySelectorAll('.table, .form-control, .form-select').forEach(el => {
        if (el.classList.contains('form-control') || el.classList.contains('form-select')) {
            el.classList.add('bg-dark','text-light','border','border-secondary');
        }
    });
});


