import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, where, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAw31dXKHw2mcG0iPrF0MnM9Ia54gHys80",
  authDomain: "fonsstudii.firebaseapp.com",
  projectId: "fonsstudii",
  storageBucket: "fonsstudii.firebasestorage.app",
  messagingSenderId: "870102268739",
  appId: "1:870102268739:web:eebd27dfa8c2e49a508df6",
  measurementId: "G-VQE0597WG1"
};

// ¡IMPORTANTE! Reemplaza 'TU_UID_DEL_ADMIN' con tu User UID de Firebase
const ADMIN_UID = 'tkC9lwmvmDSbrZDXW8k689Mi5xA3'; // Ya tienes el valor aquí

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Funciones para manejar documentos (definidas en el ámbito global 'window')
window.toggleTaskCompleted = async (docId, isCompleted) => {
    const taskRef = doc(db, 'tasks', docId);
    await updateDoc(taskRef, { completed: !isCompleted });
};

window.deleteDocument = async (collectionName, docId) => {
    if (confirm("¿Estás seguro de que quieres eliminar este elemento?")) {
        const docRef = doc(db, collectionName, docId);
        try {
            await deleteDoc(docRef);
        } catch (e) {
            console.error("Error al eliminar el documento: ", e);
            alert("Hubo un error al intentar eliminar. Por favor, inténtalo de nuevo.");
        }
    }
};

// Espera a que el DOM esté completamente cargado antes de ejecutar el script
document.addEventListener('DOMContentLoaded', () => {

    // Variables y elementos del DOM
    const errorMessage = document.getElementById('error-message');
    const showErrorMessage = (msg) => {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    };
    const hideErrorMessage = () => {
        errorMessage.style.display = 'none';
    };
    const libraryInputGroup = document.querySelector('#library .input-group');

    // Frases motivacionales
    const frases = ["¡Tu esfuerzo hoy será tu éxito mañana!", "Cada pequeño paso te acerca a tu meta.", "Aprender algo nuevo cada día te hace más fuerte."];
    let indexFrase = 0;
    const motivacionElement = document.getElementById('motivacion');
    if (motivacionElement) {
        setInterval(() => {
            indexFrase = (indexFrase + 1) % frases.length;
            motivacionElement.textContent = frases[indexFrase];
        }, 5000);
    }

    // Escuchadores de eventos para autenticación
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        hideErrorMessage();
        try { await signInWithEmailAndPassword(auth, email, password); }
        catch (e) { showErrorMessage("Error al iniciar sesión: " + e.message); }
    });

    document.getElementById('registerBtn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        hideErrorMessage();
        try { await createUserWithEmailAndPassword(auth, email, password); }
        catch (e) { showErrorMessage("Error al registrar: " + e.message); }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await signOut(auth);
    });

    // Cambia la interfaz según el estado de autenticación (¡Solo una vez!)
    onAuthStateChanged(auth, user => {
        if (user) {
            console.log("ID del usuario actual:", user.uid);
            document.getElementById('auth-container').style.display = "none";
            document.getElementById('app-container').style.display = "block";
            document.getElementById('user-email').textContent = user.email;
            loadData(user.uid);
            
            // Oculta/muestra el formulario de la biblioteca para usuarios no administradores
            if (user.uid === ADMIN_UID) { // <-- Se usa la constante
                libraryInputGroup.style.display = 'flex';
            } else {
                libraryInputGroup.style.display = 'none';
            }

        } else {
            document.getElementById('auth-container').style.display = "block";
            document.getElementById('app-container').style.display = "none";
        }
    });

    // Funcionalidad de las pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Obtiene el ID del usuario actual
    const getUserId = () => auth.currentUser?.uid;

    // Escuchadores para añadir datos
    document.getElementById('addTaskBtn').addEventListener('click', async () => {
        const text = document.getElementById('task-input').value;
        const date = document.getElementById('task-date').value; // <-- Se agrega la captura de la fecha
        if (!text) return alert("Por favor, introduce una tarea.");
        await addDoc(collection(db, 'tasks'), { 
            text, 
            date, // <-- Se guarda la fecha
            completed: false, 
            userId: getUserId(), 
            createdAt: new Date() 
        });
        document.getElementById('task-input').value = "";
        document.getElementById('task-date').value = "";
    });

    document.getElementById('addScheduleBtn').addEventListener('click', async () => {
        const subject = document.getElementById('schedule-subject').value;
        const day = document.getElementById('schedule-day').value;
        const time = document.getElementById('schedule-time').value;
        if (!subject || !time) return alert("Por favor, completa los campos de materia y hora.");
        await addDoc(collection(db, 'schedule'), { subject, day, time, userId: getUserId(), createdAt: new Date() });
        document.getElementById('schedule-subject').value = "";
        document.getElementById('schedule-time').value = "";
    });

    document.getElementById('addExamBtn').addEventListener('click', async () => {
        const title = document.getElementById('exam-title').value;
        const date = document.getElementById('exam-date').value;
        if (!title || !date) return alert("Por favor, completa los campos de título y fecha.");
        await addDoc(collection(db, 'exams'), { title, date, userId: getUserId(), createdAt: new Date() });
        document.getElementById('exam-title').value = "";
        document.getElementById('exam-date').value = "";
    });

    // El botón de añadir posts solo es visible para el admin
    document.getElementById('addPostBtn').addEventListener('click', async () => {
        if (getUserId() !== ADMIN_UID) { // <-- Se usa la constante
            return alert("Solo el administrador puede publicar en la biblioteca.");
        }
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        if (!title || !content) return alert("Por favor, completa los campos de título y contenido.");
        await addDoc(collection(db, 'library'), { title, content, userId: getUserId(), createdAt: new Date() });
        document.getElementById('post-title').value = "";
        document.getElementById('post-content').value = "";
    });

    // Carga y muestra los datos
    function loadData(userId) {
        // Tareas (solo las del usuario actual)
        onSnapshot(query(collection(db, 'tasks'), where('userId', '==', userId), orderBy('createdAt', 'desc')), snap => {
            const list = document.getElementById('tasks-list');
            list.innerHTML = "";
            snap.docs.forEach(d => {
                const data = d.data();
                const li = document.createElement('li');
                li.id = d.id;
                li.className = data.completed ? 'completed' : '';
                li.innerHTML = `
                    <span>
                        ${data.text} 
                        ${data.date ? `- **Fecha límite:** ${data.date}` : ''}
                    </span>
                    <div class="actions-buttons">
                        <button onclick="toggleTaskCompleted('${d.id}', ${data.completed})">${data.completed ? 'Desmarcar' : 'Completar'}</button>
                        <button class="delete-btn" onclick="deleteDocument('tasks', '${d.id}')">Eliminar</button>
                    </div>
                `;
                list.appendChild(li);
            });
        });

        // Horario (solo las del usuario actual)
        onSnapshot(query(collection(db, 'schedule'), where('userId', '==', userId), orderBy('createdAt', 'desc')), snap => {
            const table = document.getElementById('schedule-table');
            table.innerHTML = "";
            snap.docs.forEach(d => {
                const data = d.data();
                const tr = document.createElement('tr');
                tr.id = d.id;
                tr.innerHTML = `
                    <td>${data.subject}</td>
                    <td>${data.day}</td>
                    <td>${data.time}</td>
                    <td><button class="delete-btn" onclick="deleteDocument('schedule', '${d.id}')">Eliminar</button></td>
                `;
                table.appendChild(tr);
            });
        });

        // Exámenes (solo los del usuario actual)
        onSnapshot(query(collection(db, 'exams'), where('userId', '==', userId), orderBy('createdAt', 'desc')), snap => {
            const list = document.getElementById('exams-list');
            list.innerHTML = "";
            snap.docs.forEach(d => {
                const data = d.data();
                const li = document.createElement('li');
                li.id = d.id;
                li.innerHTML = `
                    <span><strong>${data.title}</strong> - ${data.date}</span>
                    <button class="delete-btn" onclick="deleteDocument('exams', '${d.id}')">Eliminar</button>
                `;
                list.appendChild(li);
            });
        });

        // Biblioteca (posts de todos los usuarios)
        onSnapshot(query(collection(db, 'library'), orderBy('createdAt', 'desc')), snap => {
            const list = document.getElementById('library-list');
            list.innerHTML = "";
            snap.docs.forEach(d => {
                const data = d.data();
                const li = document.createElement('li');
                li.id = d.id;
                li.innerHTML = `
                    <div>
                        <strong>${data.title}</strong>
                        <p>${data.content}</p>
                    </div>
                    ${data.userId === userId ? `<button class="delete-btn" onclick="deleteDocument('library', '${d.id}')">Eliminar</button>` : ''}
                `;
                list.appendChild(li);
            });
        });
    }
});
