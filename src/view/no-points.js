import AbstractView from './abstract';

const createNoPointsTemplate = () => `<p class="trip-events__msg">Click New Event to create your first point</p>`;


export default class NoPointsView extends AbstractView {
  getTemplate() {
    return createNoPointsTemplate();
  }
}
