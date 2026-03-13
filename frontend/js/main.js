const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const quoteForm = document.getElementById("quoteForm");
const revealElements = document.querySelectorAll(".reveal");
const header = document.getElementById("header");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

const revealOnScroll = () => {
  revealElements.forEach((element) => {
    const windowHeight = window.innerHeight;
    const elementTop = element.getBoundingClientRect().top;
    const visiblePoint = 100;

    if (elementTop < windowHeight - visiblePoint) {
      element.classList.add("active");
    }
  });
};

window.addEventListener("scroll", () => {
  revealOnScroll();

  if (header) {
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
});

revealOnScroll();

if (quoteForm) {
  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const evento = document.getElementById("evento").value;
    const personas = document.getElementById("personas").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();

    try {
      const response = await fetch("http://localhost:3001/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre,
          telefono,
          evento,
          personas,
          mensaje
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar la cotización.");
      }

      alert("Cotización enviada correctamente. También puedes continuar por WhatsApp.");

      const texto = `Hola, soy ${nombre}. Quiero cotizar un evento con Banquetes Almar.
Tipo de evento: ${evento}
Teléfono: ${telefono}
Cantidad de personas: ${personas}
Detalles: ${mensaje}`;

      const numeroWhatsApp = "573148849011";
      const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;

      quoteForm.reset();
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}