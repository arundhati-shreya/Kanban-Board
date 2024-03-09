const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const todoLane = document.getElementById("todo-lane");
let taskIdCounter = 0;

window.addEventListener("DOMContentLoaded", () => {
    loadTasksFromFirebase();
});

form.addEventListener("submit", async (e) => {
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

    await saveTaskToFirebase(value, 'todo', taskIdCounter - 1); 

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

async function saveTaskToFirebase(taskValue, status, order) {
    try {
        const response = await fetch(`https://expense-tracker-e0688-default-rtdb.firebaseio.com/tasks/${status}.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: taskValue, order: order }), 
        });

        if (!response.ok) {
            throw new Error('Failed to save task to Firebase');
        }

        const data = await response.json();
        console.log("Task saved with ID:", data.name);
    } catch(error) {
        console.error('Error saving task to Firebase:', error);
    }
}

const droppables = document.querySelectorAll(".swim-lane");
droppables.forEach(zone => {
    zone.addEventListener("dragover", handleDragOver);
    zone.addEventListener("drop", handleDrop);
});

function handleDragOver(e) {
    e.preventDefault();
}

async function updateTasksOrderInFirebase(status, taskId, previousStatus, newOrder) {
    const task = document.getElementById(taskId);
    const taskValue = task.innerText;

    try {
        if (previousStatus !== status) {
            await axios.delete(`https://expense-tracker-e0688-default-rtdb.firebaseio.com/tasks/${previousStatus}/${taskId}.json`);
        }

        await axios.put(`https://expense-tracker-e0688-default-rtdb.firebaseio.com/tasks/${status}/${taskId}.json`, { value: taskValue, order: newOrder });
        
        console.log("Task status and order updated successfully in Firebase");
    } catch(error) {
        console.error('Error updating task status and order in Firebase:', error)
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

    const targetTasks = targetZone.querySelectorAll(".task");
    const dropIndex = Array.from(targetTasks).indexOf(e.target);

    if (curTask.parentElement === targetZone && dropIndex > -1) {
        const currentIndex = Array.from(targetTasks).indexOf(curTask);
        if (currentIndex !== dropIndex) {
 
            curTask.parentElement.removeChild(curTask);
            
            if (dropIndex < currentIndex) {
                targetZone.insertBefore(curTask, targetTasks[dropIndex]);
            } else {
                targetZone.insertBefore(curTask, targetTasks[dropIndex + 1]);
            }

            const status = targetZone.dataset.status;
            const taskId = curTask.id;
            const newOrder = Array.from(targetZone.querySelectorAll(".task")).indexOf(curTask);
            updateTasksOrderInFirebase(status, taskId, previousStatus, newOrder);
        }
    } else {
        curTask.parentElement.removeChild(curTask);
        targetZone.appendChild(curTask);
        const status = targetZone.dataset.status;
        const taskId = curTask.id;
        const newOrder = Array.from(targetZone.querySelectorAll(".task")).indexOf(curTask);
        updateTasksOrderInFirebase(status, taskId, previousStatus, newOrder);
    }
}
