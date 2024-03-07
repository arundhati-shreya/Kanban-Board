const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const todoLane = document.getElementById("todo-lane");
let taskIdCounter = 0; 

window.addEventListener("DOMContentLoaded", () => {
    loadTasksFromFirebase();
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value;

    if (!value) return;

    const newTask = document.createElement("p");
    newTask.classList.add("task");
    newTask.setAttribute("draggable", "true");
    newTask.innerText = value;
    newTask.id = `task-${taskIdCounter++}`;

    newTask.addEventListener("dragstart", handleDragStart);
    newTask.addEventListener("dragend", handleDragEnd);

    todoLane.appendChild(newTask);

    saveTaskToFirebase(value, 'todo');

    input.value = "";
});

function handleDragStart() {
    this.classList.add("is-dragging");
}

function handleDragEnd() {
    this.classList.remove("is-dragging");
}

function loadTasksFromFirebase() {
    fetch('https://expense-tracker-e0688-default-rtdb.firebaseio.com/tasks.json')
    .then(response => response.json())
    .then(data => {
        if (data) {
            Object.keys(data).forEach(key => {
                const tasks = data[key];
                const status = key;
                
                if (tasks) {
                    Object.keys(tasks).forEach(taskKey => {
                        const task = tasks[taskKey];
                        
                        const newTask = document.createElement("p");
                        newTask.classList.add("task");
                        newTask.setAttribute("draggable", "true");
                        newTask.innerText = task.value;
                        newTask.id = taskKey; 

                        newTask.addEventListener("dragstart", handleDragStart);
                        newTask.addEventListener("dragend", handleDragEnd);

                        const targetLane = document.querySelector(`[data-status="${status}"]`);
                        if (targetLane) {
                            targetLane.appendChild(newTask);
                        }
                    });
                }
            });
        }
    })
    .catch(error => console.error('Error loading tasks from Firebase:', error));
}

function saveTaskToFirebase(taskValue, status) {
    fetch(`https://expense-tracker-e0688-default-rtdb.firebaseio.com/tasks/${status}.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: taskValue }), 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save task to Firebase');
        }
        return response.json();
    })
    .then(data => {
        console.log("Task saved with ID:", data.name);
    })
    .catch(error => console.error('Error saving task to Firebase:', error));
}

const droppables = document.querySelectorAll(".swim-lane");
droppables.forEach(zone => {
    zone.addEventListener("dragover", handleDragOver);
    zone.addEventListener("drop", handleDrop);
});

function handleDragOver(e) {
    e.preventDefault();
}

async function updateTasksOrderInFirebase(status, taskId,previousStatus) {
    const task = document.getElementById(taskId);
    const taskValue = task.innerText;


    try {
        
    
        if (previousStatus !== status) {
            await axios.delete(`https://expense-tracker-e0688-default-rtdb.firebaseio.com/tasks/${previousStatus}/${taskId}.json`);
        }

      
        await axios.put(`https://expense-tracker-e0688-default-rtdb.firebaseio.com/tasks/${status}/${taskId}.json`, { value: taskValue });
        
        console.log("Task status updated successfully in Firebase");
    } catch(error) {
        console.error('Error updating task status in Firebase:', error)
    }
}

function handleDrop(e) {
    e.preventDefault();
    const curTask = document.querySelector(".is-dragging");
    let targetZone = e.target;

    while (targetZone && !targetZone.classList.contains("swim-lane")) {
        targetZone = targetZone.parentElement;
    }

    if (!targetZone) return;
    const previousStatus = curTask.parentElement.dataset.status;
    console.log(previousStatus);
  
    curTask.parentElement.removeChild(curTask);

    targetZone.appendChild(curTask);

    const status = targetZone.dataset.status;
    const taskId = curTask.id;
    updateTasksOrderInFirebase(status, taskId,previousStatus);
}
