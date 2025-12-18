import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, X, Trash2, ChevronRight } from 'lucide-react';

const WorkoutTracker = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [workouts, setWorkouts] = useState([]);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);

  // Load workouts from storage
  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const result = await window.storage.list('workout:');
      if (result && result.keys) {
        const workoutPromises = result.keys.map(async (key) => {
          const data = await window.storage.get(key);
          return data ? JSON.parse(data.value) : null;
        });
        const loadedWorkouts = (await Promise.all(workoutPromises))
          .filter(w => w !== null)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setWorkouts(loadedWorkouts);
      }
    } catch (error) {
      console.log('No workouts found or error loading:', error);
    }
  };

  const saveWorkout = async (workout) => {
    try {
      await window.storage.set(`workout:${workout.id}`, JSON.stringify(workout));
      await loadWorkouts();
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const deleteWorkout = async (workoutId) => {
    try {
      await window.storage.delete(`workout:${workoutId}`);
      await loadWorkouts();
      setShowDeleteModal(false);
      setWorkoutToDelete(null);
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const startNewWorkout = () => {
    setCurrentWorkout({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercises: []
    });
    setCurrentScreen('newWorkout');
  };

  const addExercise = () => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: Date.now().toString(),
          name: '',
          sets: [{ reps: '', weight: '' }]
        }
      ]
    }));
  };

  const updateExerciseName = (exerciseId, name) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, name } : ex
      )
    }));
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) =>
                idx === setIndex ? { ...set, [field]: value } : set
              )
            }
          : ex
      )
    }));
  };

  const addSet = (exerciseId) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] }
          : ex
      )
    }));
  };

  const removeExercise = (exerciseId) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
  };

  const validateAndSaveWorkout = async () => {
    if (currentWorkout.exercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    for (const exercise of currentWorkout.exercises) {
      if (!exercise.name.trim()) {
        alert('Please enter exercise name');
        return;
      }
      for (const set of exercise.sets) {
        if (!set.reps || parseInt(set.reps) <= 0) {
          alert('Reps must be greater than 0');
          return;
        }
        if (set.weight && parseFloat(set.weight) < 0) {
          alert('Weight must be 0 or greater');
          return;
        }
      }
    }

    await saveWorkout(currentWorkout);
    setCurrentScreen('home');
    setCurrentWorkout(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleLongPress = (workout) => {
    setWorkoutToDelete(workout);
    setShowDeleteModal(true);
  };

  // Home Screen
  const HomeScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800">Workout Tracker</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <button
          onClick={startNewWorkout}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <Plus size={24} />
          Start New Workout
        </button>

        <div className="mt-6 space-y-3">
          {workouts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No workouts yet</p>
              <p className="text-sm mt-2">Tap "Start New Workout" to begin</p>
            </div>
          ) : (
            workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div
                  onClick={() => {
                    setSelectedWorkout(workout);
                    setCurrentScreen('detail');
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPress(workout);
                  }}
                  onTouchStart={(e) => {
                    const touchTimeout = setTimeout(() => handleLongPress(workout), 500);
                    e.target.touchTimeout = touchTimeout;
                  }}
                  onTouchEnd={(e) => {
                    if (e.target.touchTimeout) {
                      clearTimeout(e.target.touchTimeout);
                    }
                  }}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {formatDate(workout.date)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // New Workout Screen
  const NewWorkoutScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Discard workout?')) {
                setCurrentScreen('home');
                setCurrentWorkout(null);
              }
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <h1 className="text-xl font-bold text-gray-800">New Workout</h1>
          <button
            onClick={validateAndSaveWorkout}
            className="text-blue-500 hover:text-blue-600 font-semibold"
          >
            Save
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <label className="text-sm font-medium text-gray-700">Workout Date</label>
          <input
            type="date"
            value={currentWorkout.date.split('T')[0]}
            onChange={(e) =>
              setCurrentWorkout({
                ...currentWorkout,
                date: new Date(e.target.value).toISOString()
              })
            }
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={addExercise}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-md mb-6 transition-colors"
        >
          <Plus size={20} />
          Add Exercise
        </button>

        <div className="space-y-4">
          {currentWorkout.exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <input
                  type="text"
                  placeholder="Exercise Name"
                  value={exercise.name}
                  onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                  className="flex-1 text-lg font-semibold border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-1"
                />
                <button
                  onClick={() => removeExercise(exercise.id)}
                  className="ml-2 text-red-500 hover:text-red-600"
                >
                  <X size={20} />
                </button>
              </div>

              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Set {setIndex + 1}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Reps</label>
                      <input
                        type="number"
                        placeholder="12"
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(exercise.id, setIndex, 'reps', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        placeholder="20"
                        value={set.weight}
                        onChange={(e) =>
                          updateSet(exercise.id, setIndex, 'weight', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => addSet(exercise.id)}
                className="w-full text-blue-500 hover:text-blue-600 font-medium py-2 text-sm"
              >
                + Add Set
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Workout Detail Screen
  const WorkoutDetailScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => {
              setCurrentScreen('home');
              setSelectedWorkout(null);
            }}
            className="text-blue-500 hover:text-blue-600 font-semibold"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-800 ml-4">Workout Detail</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {formatDate(selectedWorkout.date)}
          </h2>
        </div>

        <div className="space-y-4">
          {selectedWorkout.exercises.map((exercise, exIndex) => (
            <div
              key={exercise.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {exercise.name}
              </h3>

              {exercise.sets.map((set, setIndex) => (
                <div
                  key={setIndex}
                  className="mb-2 pb-2 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Set {setIndex + 1}
                    </span>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">{set.reps}</span> reps
                      {set.weight && (
                        <>
                          {' × '}
                          <span className="font-semibold">{set.weight}</span> kg
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Delete Confirmation Modal
  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={24} className="text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800">Delete Workout</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this workout? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setWorkoutToDelete(null);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteWorkout(workoutToDelete.id)}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans">
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'newWorkout' && <NewWorkoutScreen />}
      {currentScreen === 'detail' && <WorkoutDetailScreen />}
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default WorkoutTracker;
