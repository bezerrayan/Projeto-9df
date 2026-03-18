import argparse
import json
import os
import sqlite3
from functools import wraps

from flask import Flask, jsonify, redirect, request, send_from_directory, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "admin_auth.db")
CONTENT_PATH = os.path.join(BASE_DIR, "site_content.json")

PORT = 5000
HOST = "0.0.0.0"

PUBLIC_PAGES = {
    "index.html",
    "sobre.html",
    "atividades.html",
    "galeria.html",
    "ramo.html",
    "projetos.html",
    "contato.html",
    "documentos.html",
    "equipe.html",
    "participar.html",
    "links.html",
}

ADMIN_PAGES = {
    "index.html": "Início",
    "sobre.html": "Sobre",
    "atividades.html": "Atividades",
    "galeria.html": "Galeria",
    "ramo.html": "Ramos",
    "projetos.html": "Projetos",
    "contato.html": "Contato",
    "documentos.html": "Documentos",
    "equipe.html": "Equipe",
    "participar.html": "Participar",
    "links.html": "Links úteis",
}


app = Flask(__name__, static_folder=None)
app.config["SECRET_KEY"] = os.environ.get("GEAR9DF_SECRET_KEY", "gear9df-dev-secret-change-me")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_db()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.commit()
    connection.close()


def ensure_content_file():
    if not os.path.exists(CONTENT_PATH):
        with open(CONTENT_PATH, "w", encoding="utf-8") as file:
            json.dump({"pages": {}, "adminPanel": {}}, file, ensure_ascii=False, indent=2)


def load_content():
    ensure_content_file()
    with open(CONTENT_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)
    if "pages" not in data or not isinstance(data["pages"], dict):
        data["pages"] = {}
    if "adminPanel" not in data or not isinstance(data["adminPanel"], dict):
        data["adminPanel"] = {}
    return data


def save_content(data):
    with open(CONTENT_PATH, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def is_authenticated():
    return bool(session.get("admin_email"))


def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not is_authenticated():
            return jsonify({"ok": False, "error": "unauthorized"}), 401
        return view_func(*args, **kwargs)

    return wrapped


def sanitize_content_payload(payload):
    if not isinstance(payload, dict):
        return {"pages": {}, "adminPanel": {}}

    pages = payload.get("pages", {})
    if not isinstance(pages, dict):
        pages = {}

    cleaned = {"pages": {}, "adminPanel": {}}

    for page_name, page_data in pages.items():
        if page_name not in ADMIN_PAGES or not isinstance(page_data, dict):
            continue

        text = page_data.get("text", {})
        images = page_data.get("images", {})
        sections = page_data.get("sections", {})
        extras = page_data.get("extras", [])

        cleaned["pages"][page_name] = {
            "text": text if isinstance(text, dict) else {},
            "images": images if isinstance(images, dict) else {},
            "sections": sections if isinstance(sections, dict) else {},
            "extras": extras if isinstance(extras, list) else [],
        }

    admin_panel = payload.get("adminPanel", {})
    if isinstance(admin_panel, dict):
        cleaned["adminPanel"] = admin_panel

    return cleaned


@app.route("/login")
def login_page():
    return send_from_directory(BASE_DIR, "login.html")


@app.route("/admin")
def admin_page():
    if not is_authenticated():
        next_page = request.args.get("page", "index.html")
        return redirect(url_for("login_page", next=next_page))
    return send_from_directory(BASE_DIR, "admin.html")


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"ok": False, "error": "missing_credentials"}), 400

    connection = get_db()
    admin = connection.execute(
        "SELECT email, password_hash, active FROM admins WHERE email = ?",
        (email,),
    ).fetchone()
    connection.close()

    if not admin or not admin["active"] or not check_password_hash(admin["password_hash"], password):
        return jsonify({"ok": False, "error": "invalid_credentials"}), 401

    session["admin_email"] = admin["email"]
    return jsonify({"ok": True, "email": admin["email"]})


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/auth/session")
def auth_session():
    return jsonify(
        {
            "authenticated": is_authenticated(),
            "email": session.get("admin_email"),
        }
    )


@app.route("/api/site-content")
def api_site_content():
    return jsonify(load_content())


@app.route("/api/admin/content")
@login_required
def api_admin_content():
    return jsonify(load_content())


@app.route("/api/admin/content", methods=["POST"])
@login_required
def api_admin_content_save():
    payload = request.get_json(silent=True)
    cleaned = sanitize_content_payload(payload)
    save_content(cleaned)
    return jsonify({"ok": True})


@app.route("/api/admin/pages")
@login_required
def api_admin_pages():
    return jsonify({"pages": ADMIN_PAGES})


@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:path>")
def serve_static(path):
    full_path = os.path.join(BASE_DIR, path)

    if os.path.isfile(full_path):
        return send_from_directory(BASE_DIR, path)

    if path in PUBLIC_PAGES:
        return send_from_directory(BASE_DIR, path)

    return f"Arquivo '{path}' não encontrado.", 404


def create_admin(email, password):
    init_db()
    connection = get_db()
    connection.execute(
        """
        INSERT INTO admins (email, password_hash, active)
        VALUES (?, ?, 1)
        ON CONFLICT(email) DO UPDATE SET
            password_hash = excluded.password_hash,
            active = 1
        """,
        (email.strip().lower(), generate_password_hash(password)),
    )
    connection.commit()
    connection.close()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--create-admin", nargs=2, metavar=("EMAIL", "PASSWORD"))
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    init_db()
    ensure_content_file()

    if args.create_admin:
        email, password = args.create_admin
        create_admin(email, password)
        print(f"Administrador atualizado: {email}")
    else:
        print(f"Servidor rodando em http://127.0.0.1:{PORT}")
        app.run(host=HOST, port=PORT, debug=True)
