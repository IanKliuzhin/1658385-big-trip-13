import FilterPresenter from './presenter/filters';
import TripPresenter from './presenter/trip';
import FiltersModel from './model/filters';
import PointsModel from './model/points';
import DestinationsModel from './model/destinations';
import OffersModel from './model/offers';
import MenuView from './view/menu';
import StatsView from './view/stats';
import {render, remove} from './utils/render';
import {TabType, UpdateType} from './const';
import Api from './api/api';
import Store from "./api/store.js";
import Provider from "./api/provider.js";
import {toast, removeToast} from "./utils/toast/toast.js";
import {getIsOnline} from "./utils/common";

const AUTHORIZATION_KEY = `dauofv0984q3a`;
const AUTHORIZATION = `Basic ${AUTHORIZATION_KEY}`;
const END_POINT = `https://13.ecmascript.pages.academy/big-trip`;
const STORE_NAME = `big-trip-storage`;
const STORE_PREFIX = `${STORE_NAME}-${AUTHORIZATION_KEY}`;

const baseApi = new Api(END_POINT, AUTHORIZATION);
const store = new Store(STORE_PREFIX, window.localStorage);
const api = new Provider(baseApi, store);

const pageBodyElement = document.querySelector(`.page-body`);
const pageHeaderElement = pageBodyElement.querySelector(`.page-header`);
const pageMainElement = pageBodyElement.querySelector(`.page-main`);
const pageBodyContainerElement = pageMainElement.querySelector(`.page-body__container`);

const tripMainElement = pageHeaderElement.querySelector(`.trip-main`);
const tripControlsElement = tripMainElement.querySelector(`.trip-controls`);

const menuContainerElement = tripControlsElement.querySelector(`.menu-container`);
const filtersContainerElement = tripControlsElement.querySelector(`.filters-container`);

const tripEventsElement = pageBodyContainerElement.querySelector(`.trip-events`);

const newEventButton = tripMainElement.querySelector(`.trip-main__event-add-btn`);

let statsElement = null;

const renderMenu = (container) => {
  const menuElement = new MenuView();
  render(container, menuElement);

  const handleMenuClick = (tab) => {
    menuElement.setActiveTab(tab);
    switch (tab) {
      case TabType.TABLE:
        remove(statsElement);
        tripPresenter.init(newEventButton, destinationsModel, offersModel);
        break;
      case TabType.STATS:
        tripPresenter.destroy();
        statsElement = new StatsView(pointsModel.getPoints());
        render(pageBodyContainerElement, statsElement);
        break;
    }
  };

  menuElement.setMenuClickHandler(handleMenuClick);
};

const pointsModel = new PointsModel();
const destinationsModel = new DestinationsModel();
const offersModel = new OffersModel();
const filtersModel = new FiltersModel();

const tripPresenter = new TripPresenter(pointsModel, filtersModel, tripEventsElement, tripMainElement, api);

const filtersPresenter = new FilterPresenter(filtersModel, filtersContainerElement, pointsModel);

tripPresenter.init(newEventButton, destinationsModel, offersModel);

const blockEditing = () => {
  document.title += ` [offline]`;
  toast(`Offline mode. Creating & editing point is unavailable!`);
  tripPresenter.disableEditing();
  newEventButton.disabled = true;
};

const unblockEditing = () => {
  document.title = document.title.replace(` [offline]`, ``);
  removeToast();
  tripPresenter.enableEditing();
  newEventButton.disabled = false;
};

Promise.all([
  api.getPoints(), api.getDestinations(), api.getOffers()
])
  .then(([points, descriptions, offers]) => {
    destinationsModel.descriptions = descriptions;
    offersModel.offers = offers;
    pointsModel.setPoints(UpdateType.INIT, points);
  })
  .catch(() => {
    pointsModel.setPoints(UpdateType.INIT, []);
  })
  .finally(() => {
    renderMenu(menuContainerElement);
    filtersPresenter.init();
    if (!getIsOnline()) {
      blockEditing();
    } else {
      unblockEditing();
    }
  });

newEventButton.addEventListener(`click`, (evt) => {
  evt.preventDefault();
  tripPresenter.createPoint();
});

window.addEventListener(`load`, () => {
  navigator.serviceWorker.register(`/sw.js`);
});

window.addEventListener(`online`, () => {
  unblockEditing();
  if (api.getIsNotSynced()) {
    toast(`Back online. Syncing offline data...`);
    api.sync()
      .finally(() => {
        removeToast();
      });
  }
});

window.addEventListener(`offline`, () => {
  blockEditing();
});
