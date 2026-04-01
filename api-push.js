const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");

const JWT_SECRET = "gear9df-dev-secret-change-me"; // Default from server.js
const email = "yandev@l4ckos.com.br"; // From your screenshot

const token = jwt.sign({ email: email }, JWT_SECRET, { expiresIn: "1h" });

const content = JSON.parse(fs.readFileSync(path.join(__dirname, "site_content.json"), "utf8"));

async function push() {
    console.log("Enviando conteúdo atualizado via API local...");
    try {
        const response = await fetch("http://localhost:5000/api/admin/content", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(content)
        });
        
        const result = await response.json();
        if (result.ok) {
            console.log("✅ Conteúdo sincronizado com sucesso via API!");
        } else {
            console.error("❌ Falha na API:", result);
        }
    } catch (e) {
        console.error("❌ Erro de conexão:", e.message);
    }
}

push();
