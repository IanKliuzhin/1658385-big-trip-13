import {generatePoint} from './mock/point';
import FilterPresenter from './presenter/filters';
import TripPresenter from './presenter/trip';
import FiltersModel from './model/filters';
import PointsModel from './model/points';
import MenuView from './view/menu';
import StatsView from './view/stats';
import {render, remove} from './utils/render';
import {TabType} from './const';

const POINTS_AMOUNT = 30;

const points = new Array(POINTS_AMOUNT).fill().map(generatePoint);

const pageBodyElement = document.querySelector(`.page-body`);
const pageHeaderElement = pageBodyElement.querySelector(`.page-header`);
const pageMainElement = pageBodyElement.querySelector(`.page-main`);
const pageBodyContainerElement = pageMainElement.querySelector(`.page-body__container`);

const tripMainElement = pageHeaderElement.querySelector(`.trip-main`);
const tripInfoElement = tripMainElement.querySelector(`.trip-info`);
const tripControlsElement = tripMainElement.querySelector(`.trip-controls`);

const menuContainerElement = tripControlsElement.querySelector(`.menu-container`);
const filtersContainerElement = tripControlsElement.querySelector(`.filters-container`);

const tripEventsElement = pageBodyContainerElement.querySelector(`.trip-events`);

const newEventButton = tripMainElement.querySelector(`.trip-main__event-add-btn`);

const menuElement = new MenuView();
render(menuContainerElement, menuElement);

const pointsModel = new PointsModel();
pointsModel.setPoints(points);

const filtersModel = new FiltersModel();
const filtersPresenter = new FilterPresenter(filtersModel, filtersContainerElement);

const tripPresenter = new TripPresenter(pointsModel, filtersModel, tripEventsElement, tripInfoElement, newEventButton);

let statsElement = null;

const handleMenuClick = (tab) => {
  menuElement.setActiveTab(tab);
  switch (tab) {
    case TabType.TABLE:
      remove(statsElement);
      tripPresenter.init();
      break;
    case TabType.STATS:
      tripPresenter.destroy();
      statsElement = new StatsView(pointsModel.getPoints());
      render(pageBodyContainerElement, statsElement);
      break;
  }
};

menuElement.setMenuClickHandler(handleMenuClick);

filtersPresenter.init();
tripPresenter.init();

newEventButton.addEventListener(`click`, (evt) => {
  evt.preventDefault();
  tripPresenter.createPoint();
});
