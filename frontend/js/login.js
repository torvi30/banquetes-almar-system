const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en login.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("adminNombre", data.admin.nombre);

      window.location.href = "./dashboard.html";
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}