const form = document.getElementById('contactForm');

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const asunto = document.getElementById('asunto').value;
        const mensaje = document.getElementById('mensaje').value;

        console.log('Formulario enviado:', { nombre, email, asunto, mensaje });

        alert('¡Gracias por tu mensaje! Te responderemos pronto.');
        form.reset();
    });
}
