import {render, RenderPosition, replace, remove} from '../utils/render';
import SortingView from '../view/sorting';
import TripInfoView from '../view/trip-info';
import PointsListView from '../view/points-list';
import LoadingView from '../view/loading';
import NoPointsView from '../view/no-points';
import PointPresenter, {State as PointState} from './point';
import {SortType, UpdateType, ActionType, FilterType} from '../const';
import {filter} from '../utils/filter';
import {sortPointsByTime, sortPointsByPrice, sortPointsByDay} from '../utils/sort';
import NewPointPresenter from './new-point';

const MAX_FULL_ROUTE_DISPLAY_POINTS_AMOUNT = 3;

export default class TripPresenter {
  constructor(pointsModel, filtersModel, tripEventsElement, tripMainElement, api) {
    this._pointsModel = pointsModel;
    this._filtersModel = filtersModel;
    this._tripEventsElement = tripEventsElement;
    this._pointsListElement = new PointsListView();
    this._tripMainElement = tripMainElement;
    this._tripInfoElement = null;
    this._pointPresenter = new Map();
    this._currentSortType = SortType.DAY;
    this._isLoading = true;
    this._destinationsModel = null;
    this._offersModel = null;
    this._newPointPresenter = null;
    this._api = api;

    this._sortingElement = null;
    this._tripInfoMainElement = null;
    this._tripInfoCostElement = null;
    this._loadingElement = new LoadingView();
    this._noPointsElement = new NoPointsView();

    this._handleViewAction = this._handleViewAction.bind(this);
    this._handleModeChange = this._handleModeChange.bind(this);
    this._handleSortTypeChange = this._handleSortTypeChange.bind(this);
    this._handleModelEvent = this._handleModelEvent.bind(this);
  }

  init(newEventButton, destinationsModel, offersModel) {
    this._filtersModel.addObserver(this._handleModelEvent);
    this._pointsModel.addObserver(this._handleModelEvent);
    render(this._tripEventsElement, this._pointsListElement);
    this._renderPointsDependentElements();

    this._destinationsModel = destinationsModel;
    this._offersModel = offersModel;
    this._newPointPresenter = new NewPointPresenter(this._pointsListElement, this._handleViewAction, newEventButton, destinationsModel, offersModel);
  }

  createPoint() {
    this._filtersModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this._newPointPresenter.init();
  }

  destroy() {
    if (this._sortingElement !== null) {
      remove(this._sortingElement);
      this._sortingElement = null;
    }

    this._currentSortType = SortType.DAY;

    this._clearPointsList();
    remove(this._pointsListElement);

    this._filtersModel.removeObserver(this._handleModelEvent);
    this._pointsModel.removeObserver(this._handleModelEvent);
  }

  disableEditing() {
    this._pointPresenter.forEach((presenter) => presenter.setViewState(PointState.DISABLED));
    this._newPointPresenter.setIsDisabled(true);
  }

  enableEditing() {
    this._pointPresenter.forEach((presenter) => presenter.setViewState(PointState.ENABLED));
    this._newPointPresenter.setIsDisabled(false);
  }

  _renderPointsDependentElements() {
    if (this._isLoading) {
      this._renderLoading();
      return;
    }

    this._renderTripInfo();
    this._renderSorting();

    if (this._getPoints().length) {
      this._renderPointsList();
    } else {
      this._renderNoPoints();
    }
  }

  _getPoints() {
    const filterName = this._filtersModel.getFilter();
    const points = this._pointsModel.getPoints();
    const filteredPoints = filter[filterName](points);

    switch (this._currentSortType) {
      case SortType.TIME:
        filteredPoints.sort(sortPointsByTime);
        break;
      case SortType.PRICE:
        filteredPoints.sort(sortPointsByPrice);
        break;
      default:
        filteredPoints.sort(sortPointsByDay);
    }

    return filteredPoints;
  }

  _handleModelEvent(updateType, data) {
    switch (updateType) {
      case UpdateType.INIT:
        this._isLoading = false;
        remove(this._loadingElement);
        this._renderPointsDependentElements();
        break;
      case UpdateType.PATCH:
        this._pointPresenter.get(data.id).init(data);
        this._renderTripInfo();
        break;
      case UpdateType.MINOR:
        this._clearPointsList();
        this._renderTripInfo();
        this._renderPointsList();
        break;
      case UpdateType.MAJOR:
        this._clearPointsList();
        this._currentSortType = SortType.DAY;
        this._renderTripInfo();
        this._renderSorting();
        this._renderPointsList();
        break;
    }
  }

  _handleModeChange() {
    this._newPointPresenter.destroy();
    this._pointPresenter.forEach((presenter) => presenter.resetView());
  }

  _handleViewAction(actionType, updateType, updatedPoint, withoutSavingState = false) {
    switch (actionType) {
      case ActionType.UPDATE:
        if (!withoutSavingState) {
          this._pointPresenter.get(updatedPoint.id).setViewState(PointState.SAVING);
        }
        this._api.updatePoint(updatedPoint)
          .then((response) => {
            this._pointsModel.updatePoint(updateType, response);
          })
          .catch(() => {
            this._pointPresenter.get(updatedPoint.id).setViewState(PointState.SHAKING);
          });
        break;
      case ActionType.DELETE:
        this._pointPresenter.get(updatedPoint.id).setViewState(PointState.DELETING);
        this._api.deletePoint(updatedPoint)
          .then(() => {
            this._pointsModel.deletePoint(updateType, updatedPoint);
          })
          .catch(() => {
            this._pointPresenter.get(updatedPoint.id).setViewState(PointState.SHAKING);
          });
        break;
      case ActionType.ADD:
        this._newPointPresenter.setIsSaving();
        this._api.addPoint(updatedPoint)
          .then((response) => {
            this._pointsModel.addPoint(updateType, response);
          })
          .catch(() => {
            this._newPointPresenter.resetStateWithShake();
          });
        break;
    }
  }

  _renderTripInfo() {
    const prevTripInfoElement = this._tripInfoElement;

    const points = this._pointsModel.getPoints().sort(sortPointsByDay);
    const route = TripPresenter.getTripRoute(points);
    const dates = TripPresenter.getTripDates(points);
    const cost = TripPresenter.calcTripCost(points);
    this._tripInfoElement = new TripInfoView(route, dates, cost);

    if (prevTripInfoElement === null) {
      render(this._tripMainElement, this._tripInfoElement, RenderPosition.AFTERBEGIN);
    } else {
      replace(this._tripInfoElement, prevTripInfoElement);
      remove(prevTripInfoElement);
    }
  }

  _handleSortTypeChange(sortType) {
    if (this._currentSortType === sortType) {
      return;
    }

    this._currentSortType = sortType;

    this._clearPointsList();
    this._renderSorting();
    this._renderPointsList();
  }

  _renderSorting() {
    const prevSortingElement = this._sortingElement;

    this._sortingElement = new SortingView(this._currentSortType);
    this._sortingElement._setSortTypeChangeHandler(this._handleSortTypeChange);

    if (prevSortingElement === null) {
      render(this._tripEventsElement, this._sortingElement, RenderPosition.AFTERBEGIN);
      return;
    }

    replace(this._sortingElement, prevSortingElement);
    remove(prevSortingElement);
  }

  _renderLoading() {
    render(this._tripEventsElement, this._loadingElement);
  }

  _renderNoPoints() {
    render(this._tripEventsElement, this._noPointsElement);
  }

  _renderPoint(point) {
    const pointPresenter = new PointPresenter(this._pointsListElement, this._handleViewAction, this._handleModeChange, this._destinationsModel, this._offersModel);
    pointPresenter.init(point);
    this._pointPresenter.set(point.id, pointPresenter);
  }

  _renderPointsList() {
    for (const point of this._getPoints()) {
      this._renderPoint(point);
    }
  }

  _clearPointsList() {
    this._newPointPresenter.destroy();
    this._pointPresenter.forEach((presenter) => presenter.destroy());

    remove(this._loadingElement);
    this._pointPresenter = new Map();
  }

  static getTripRoute(points) {
    let destinations = [];
    points.forEach((point) => {
      const lastDestination = destinations.slice(-1)[0];
      if (point.destination !== lastDestination) {
        destinations.push(point.destination);
      }
    });

    if (destinations.length > MAX_FULL_ROUTE_DISPLAY_POINTS_AMOUNT) {
      destinations = [destinations[0], `...`, destinations.pop()];
    }

    return destinations.join(` &mdash; `);
  }

  static getTripDates(points) {
    if (!points.length) {
      return ``;
    }

    let {start, end} = points[0].times;
    points.forEach((point) => {
      if (point.times.start.diff(start) < 0) {
        start = point.times.start;
      }
      if (point.times.end.diff(end) > 0) {
        end = point.times.end;
      }
    });

    return start.month() === end.month()
      ? `${start.format(`MMM D`).toUpperCase()}&nbsp;&mdash;&nbsp;${end.date()}`
      : `${start.format(`MMM D`).toUpperCase()}&nbsp;&mdash;&nbsp;${end.format(`MMM D`).toUpperCase()}`;
  }

  static calcTripCost(points) {
    return points.reduce((sum, point) => {
      return sum + point.price + point.offers.reduce((oSum, offer) => oSum + offer.price, 0);
    }, 0);
  }
}
