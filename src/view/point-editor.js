import {OFFERS, TYPES, DESTINATIONS} from '../mock/point';

export const createEditPointTemplate = (point = {}) => {
  const {type, destination, times, price, offers, description} = point;
  const availableOffers = OFFERS.slice().filter((offer) => offer.type === type);
  return `
    <li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type  event__type-btn" for="event-type-toggle-1">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox">

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${TYPES.map((typeToChose) => `
                  <div class="event__type-item">
                    <input id="event-type-${typeToChose.toLowerCase()}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${typeToChose.toLowerCase()}" ${typeToChose === type ? `checked` : ``}>
                    <label class="event__type-label  event__type-label--${typeToChose.toLowerCase()}" for="event-type-${typeToChose.toLowerCase()}-1">${typeToChose}</label>
                  </div>
                `).join(``)}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group  event__field-group--destination">
            <label class="event__label  event__type-output" for="event-destination-1">
              ${type}
            </label>
            <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" value=${destination} list="destination-list-1">
            <datalist id="destination-list-1">
              ${DESTINATIONS.map((destinationToChose) => `
                <option value=${destinationToChose}></option>
              `).join(``)}
            </datalist>
          </div>

          <div class="event__field-group  event__field-group--time">
            <label class="visually-hidden" for="event-start-time-1">From</label>
            <input class="event__input  event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${times.start.format(`DD/MM/YY HH:mm`)}">
            &mdash;
            <label class="visually-hidden" for="event-end-time-1">To</label>
            <input class="event__input  event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${times.end.format(`DD/MM/YY HH:mm`)}">
          </div>

          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price-1">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input  event__input--price" id="event-price-1" type="text" name="event-price" value="${price}">
          </div>

          <button class="event__save-btn  btn  btn--blue" type="submit">Save</button>
          <button class="event__reset-btn" type="reset">Cancel</button>
        </header>
        <section class="event__details">
          ${availableOffers.length ? `<section class="event__section  event__section--offers">
            <h3 class="event__section-title  event__section-title--offers">Offers</h3>

            <div class="event__available-offers">
              ${availableOffers.map((offer) => `
                <div class="event__offer-selector">
                  <input class="event__offer-checkbox  visually-hidden" id="event-offer-${offer.name.toLowerCase().split(` `).join(`-`)}-1" type="checkbox" name="event-offer-${offer.name.split(` `).join(`-`)}" ${offers.map((o) => o.name).includes(offer.name) ? `checked` : ``}>
                  <label class="event__offer-label" for="event-offer-${offer.name.split(` `).join(`-`)}-1">
                    <span class="event__offer-title">${offer.name}</span>
                    &plus;&euro;&nbsp;
                    <span class="event__offer-price">${offer.price}</span>
                  </label>
                </div>
              `).join(``)}
            </div>
          </section>` : ``}

          <section class="event__section  event__section--destination">
            <h3 class="event__section-title  event__section-title--destination">Destination</h3>
            <p class="event__destination-description">${description.text}</p>

            ${description.photos.length ? `<div class="event__photos-container">
              <div class="event__photos-tape">
                ${description.photos.map((photo) => `
                  <img class="event__photo" src=${photo} alt="Event photo">
                `).join(``)}
              </div>` : ``}
            </div>
          </section>
        </section>
      </form>
    </li>
  `;
};
