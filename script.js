'use strict';







class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;

    constructor(coords, distance, duration){
        this.coords = coords;   //[lat,lng]
        this.distance = distance;   // in km
        this.duration = duration;   // in min
        
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
        this.description = `${this.type[0].toUpperCase()}${this.type.slice( 1)} on ${
          months[this.date.getMonth()]
        } ${this.date.getDate()}`;
      }
    
    // click(){
    //     this.clicks++;
    // }
};

//Chil Classes based on Workout

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace(){
        //min/km
        this.pace = this.duration/this.distance;
        return this.pace;
    }
};

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed(){
        //km/hr
        this.speed = this.distance / (this.duration/60);
        return this.speed;
    }
};

// const run1 = new Running([30,61], 2.5, 30, 150);
// const cycling1 = new Cycling([49,70], 6, 45, 600);

// console.log(run1, cycling1);

////////////////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    //private class field for properties
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];

    constructor(){
        //get User Position
        this._getPosition();

        //Get Data from local Storage
        this._getLocalStorage();
        //EVENT Listener
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        
        //adding Event listener to parentElement
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition(){
        //getting Geo Location   
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition( this._loadMap.bind(this), function(){
        alert('unable to get the CurrentPosition!');
    });
};
    }

    _loadMap(position){       
            const {latitude} = position.coords;
            const {longitude} = position.coords;
            // console.log(latitude, longitude);
            // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
            const coords = [latitude, longitude];
           
            // const map = L.map('map').setView([51.505, -0.09], 13);
            this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
            // console.log(map);
            // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
    
            
            //Handling Click on Map
            this.#map.on('click',  this._showForm.bind(this));

            //Render Marker
            this.#workouts.forEach(work => {
                this._renderWorkout(work);
                this._renderWorkoutMarker(work);
            })
        
    }

    _showForm(e){
        this.#mapEvent = e;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm(){
        //Empty Input
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        
        form.style.display = 'none';
        //add hiddenclass
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        }, 1000);
        
    }

    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e){

        //helper Function
        const validInputs  = (...inputs) => inputs.every(inp => Number.isFinite(inp));
         const allPositive = (...inputs) => inputs.every(inp => inp > 0);

          e.preventDefault();

        // Get data from form
       const type = inputType.value;
       const distance = +inputDistance.value;
       const duration = +inputDuration.value;
       const{lat , lng} = this.#mapEvent.latlng;
       let workout;
       

        // if activity running,  create Running Obj
        if(type === 'running'){
            const cadence = +inputCadence.value;
            // check if the data is valid
            if(
            //     !Number.isFinite(distance) ||
            //    !Number.isFinite(duration) || 
            //    !Number.isFinite(cadence)
            !validInputs(distance, duration, cadence) ||
            !allPositive(distance, duration, cadence)
            )
                return alert('Input have to positive Number'); 
            
            workout = new Running([lat,lng], distance, duration, cadence);
            
            
        };

        // if activity Cycling,  create Cycling  Obj
        if(type === 'cycling'){
            const elevation = +inputElevation.value;
            // check if the data is valid
            if(
                //     !Number.isFinite(distance) ||
                //    !Number.isFinite(duration) || 
                //    !Number.isFinite(cadence)
                !validInputs(distance, duration, elevation)||!allPositive(distance, duration)
                )
                    return alert('Input have to positive Number');
            workout = new Cycling([lat,lng], distance, duration, elevation);
        }
        // Add new Object to Workout Array
        this.#workouts.push(workout);
        //Render workout on map as marker
        this._renderWorkoutMarker(workout);


        //render workout on list
        this._renderWorkout(workout);

        //Hide Form and Clear Input Fields
        this._hideForm();

        //Set Local Storage to All Workout
        this._setLocalStorage();
    }

    
    _renderWorkoutMarker(workout){
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
            L.popup({
            maxWidth: 250,
            minWidth:100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
            })
        )
        .setPopupContent(`${workout.type === 'running'?'🏃‍♂️': '🚴‍♀️'} ${workout.description}`)
        .openPopup();
    }

    _renderWorkout(workout){
        //Genral part for both running and Cycling
        let html = 
        `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running'?'🏃‍♂️': '🚴‍♀️' }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;

        //Specific part for Each part
        if(workout.type === 'running')
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
            </li>
        `;

        if(workout.type === 'cycling')
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">223${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
            </li>
            `;
        
         form.insertAdjacentHTML('afterend', html);   
        }

    _moveToPopup(e){
        const workoutElement = e.target.closest('.workout');
        // console.log(workoutElement);

        if(!workoutElement) return;

        const workout = this.#workouts.find(work => work.id === workoutElement.dataset.id);
        console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });

        //  //using public interface
        //  workout.click();
    }

        //method for to store data in Local Storage
    _setLocalStorage(){
        localStorage.setItem('workout', JSON.stringify(this.#workouts));
    }
    //method for to get data from Local Storage
    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workout'));

        //check if there is Data
        if(!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);

        });
    }

    reset() {
        localStorage.removeItem('workout');
        location.reload();
    }
 
}

    const app = new App();

    

