import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, where, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAw31dXKHw2mcG0iPrF0MnM9Ia54gHys80",
  authDomain: "fonsstudii.firebaseapp.com",
  projectId: "fonsstudii",
  storageBucket: "fonsstudii.firebasestorage.app",
  messagingSenderId: "870102268739",
  appId: "1:870102268739:web:eebd27dfa8c2e49a508df6",
  measurementId: "G-VQE0597WG1"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const errorMessage = document.getElementById('error-message');
const showErrorMessage = (msg) => {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
};
const hideErrorMessage = () => {
    errorMessage.style.display = 'none';
};

const frases = ["¡Tu esfuerzo hoy será tu éxito mañana!", "Cada pequeño paso te acerca a tu meta.", "Aprender algo nuevo cada día te hace más fuerte."];
let indexFrase = 0;
setInterval(() => {
    indexFrase = (indexFrase + 1) % frases.length;
    document.getElementById('motivacion').textContent = frases[indexFrase];
}, 5000);

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

onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('auth-container').style.display = "none";
        document.getElementById('app-container').style.display = "block";
        document.getElementById('user-email').textContent = user.email;
        loadData(user.uid);
    } else {
        document.getElementById('auth-container').style.display = "block";
        document.getElementById('app-container').style.display = "none";
    }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    });
});

const getUserId = () => auth.currentUser?.uid;

document.getElementById('addTaskBtn').addEventListener('click', async () => {
    const text = document.getElementById('task-input').value;
    if (!text) return alert("Por favor, introduce una tarea.");
    
    const list = document.getElementById('tasks-list');
    const tempLi = document.createElement('li');
    tempLi.innerHTML = `<span>${text}</span><div class="actions-buttons"><button>Completar</button><button class="delete-btn">Eliminar</button></div>`;
    list.prepend(tempLi);

    await addDoc(collection(db, 'tasks'), { text, completed: false, userId: getUserId(), createdAt: new Date() });
    document.getElementById('task-input').value = "";
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

document.getElementById('addPostBtn').addEventListener('click', async () => {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    if (!title || !content) return alert("Por favor, completa los campos de título y contenido.");
    await addDoc(collection(db, 'library'), { title, content, userId: getUserId(), createdAt: new Date() });
    document.getElementById('post-title').value = "";
    document.getElementById('post-content').value = "";
});

document.getElementById('addReviewBtn').addEventListener('click', async () => {
    const title = document.getElementById('review-title').value;
    const content = document.getElementById('review-content').value;
    if (!title || !content) return alert("Por favor, completa los campos de título y contenido.");
    await addDoc(collection(db, 'reviews'), { title, content, userId: getUserId(), userEmail: auth.currentUser.email, createdAt: new Date() });
    document.getElementById('review-title').value = "";
    document.getElementById('review-content').value = "";
});

function loadData(userId) {
    onSnapshot(query(collection(db, 'tasks'), where('userId', '==', userId), orderBy('createdAt', 'desc')), snap => {
        const list = document.getElementById('tasks-list');
        list.innerHTML = "";
        snap.docs.forEach(d => {
            const data = d.data();
            const li = document.createElement('li');
            li.id = d.id;
            li.className = data.completed ? 'completed' : '';
            li.innerHTML = `
                <span>${data.text}</span>
                <div class="actions-buttons">
                    <button onclick="toggleTaskCompleted('${d.id}', ${data.completed})">${data.completed ? 'Desmarcar' : 'Completar'}</button>
                    <button class="delete-btn" onclick="deleteDocument('tasks', '${d.id}')">Eliminar</button>
                </div>
            `;
            list.appendChild(li);
        });
    });

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
    
    // Nueva sección: Reseñas (todos los usuarios)
    onSnapshot(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')), snap => {
        const list = document.getElementById('reviews-list');
        list.innerHTML = "";
        snap.docs.forEach(d => {
            const data = d.data();
            const li = document.createElement('li');
            li.id = d.id;
            li.innerHTML = `
                <div>
                    <strong>${data.title}</strong><br>
                    <small>Por: ${data.userEmail}</small>
                    <p>${data.content}</p>
                </div>
                ${data.userId === userId ? `<button class="delete-btn" onclick="deleteDocument('reviews', '${d.id}')">Eliminar</button>` : ''}
            `;
            list.appendChild(li);
        });
    });
}

window.toggleTaskCompleted = async (docId, isCompleted) => {
    const taskRef = doc(db, 'tasks', docId);
    await updateDoc(taskRef, { completed: !isCompleted });
};

window.deleteDocument = async (collectionName, docId) => {
    if (confirm("¿Estás seguro de que quieres eliminar este elemento?")) {
        const docRef = doc(db, collectionName, docId);
        
        const element = document.getElementById(docId);
        if (element) {
            element.remove();
        }

        try {
            await deleteDoc(docRef);
        } catch (e) {
            console.error("Error al eliminar el documento: ", e);
            alert("Hubo un error al intentar eliminar. Por favor, inténtalo de nuevo.");
        }
    }
};
