import {render, replace, remove} from '../utils/render';
import PointView from '../view/point';
import PointEditorView from '../view/point-editor';
import {UpdateType, ActionType} from '../const';
import {compareTimes} from '../utils/time';
import {compareOffers, handleEscape, getIsOnline} from '../utils/common';

const Mode = {
  DEFAULT: `DEFAULT`,
  EDITING: `EDITING`
};

export const State = {
  SAVING: `SAVING`,
  DELETING: `DELETING`,
  SHAKING: `SHAKING`,
  DISABLED: `DISABLED`,
  ENABLED: `ENABLED`
};

export default class PointPresenter {
  constructor(pointsListElement, changeData, changeMode, destinationsModel, offersModel) {
    this._pointsListElement = pointsListElement;
    this._changeData = changeData;
    this._changeMode = changeMode;
    this._destinationsModel = destinationsModel;
    this._offersModel = offersModel;

    this._pointComponent = null;
    this._editPointComponent = null;
    this._mode = Mode.DEFAULT;

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleFormRollupButtonClick = this._handleFormRollupButtonClick.bind(this);
    this._handleFormSubmit = this._handleFormSubmit.bind(this);
    this._handlePointRollupButtonClick = this._handlePointRollupButtonClick.bind(this);
    this._handleFavoriteClick = this._handleFavoriteClick.bind(this);
    this._handleDeletePoint = this._handleDeletePoint.bind(this);
  }

  init(point) {
    this._point = point;

    const prevPointComponent = this._pointComponent;
    const prevEditPointComponent = this._editPointComponent;

    this._pointComponent = new PointView(point);
    this._editPointComponent = new PointEditorView(this._destinationsModel.destinations, this._offersModel.offers, this._destinationsModel.getDescription, point);

    this._pointComponent.setRollupButtonClickHandler(this._handleFormRollupButtonClick);
    this._pointComponent.setFavoriteClickHandler(this._handleFavoriteClick);
    this._editPointComponent.setFormSubmitHandler(this._handleFormSubmit);
    this._editPointComponent.setRollupButtonClickHandler(this._handlePointRollupButtonClick);
    this._editPointComponent.setDeleteClickHandler(this._handleDeletePoint);

    if (prevPointComponent === null || prevEditPointComponent === null) {
      render(this._pointsListElement, this._pointComponent);
      return;
    }

    if (this._mode === Mode.DEFAULT) {
      replace(this._pointComponent, prevPointComponent);
    }

    if (this._mode === Mode.EDITING) {
      replace(this._pointComponent, prevEditPointComponent);
      this._mode = Mode.DEFAULT;
    }

    remove(prevPointComponent);
    remove(prevEditPointComponent);
  }

  destroy() {
    remove(this._pointComponent);
    remove(this._editPointComponent);
  }

  resetView() {
    if (this._mode !== Mode.DEFAULT) {
      this._replaceFormToPoint();
    }
  }

  setViewState(state) {
    switch (state) {
      case State.SAVING:
        this._editPointComponent.updateData({
          isDisabled: true,
          isSaving: true
        });
        break;
      case State.DELETING:
        this._editPointComponent.updateData({
          isDisabled: true,
          isDeleting: true
        });
        break;
      case State.SHAKING:
        const resetFormState = () => {
          this._editPointComponent.updateData({
            isDisabled: !getIsOnline(),
            isSaving: false,
            isDeleting: false
          });
        };
        this._editPointComponent.shake(resetFormState);
        this._pointComponent.shake(resetFormState);
        break;
      case State.DISABLED:
        this._editPointComponent.updateData({
          isDisabled: true,
        });
        break;
      case State.ENABLED:
        this._editPointComponent.updateData({
          isDisabled: false,
        });
        break;
    }
  }

  _replacePointToForm() {
    this._changeMode();
    replace(this._editPointComponent, this._pointComponent);
    this._mode = Mode.EDITING;
  }

  _replaceFormToPoint() {
    document.removeEventListener(`keydown`, this._handleKeyDown);
    replace(this._pointComponent, this._editPointComponent);
    this._mode = Mode.DEFAULT;
  }

  _handleKeyDown(evt) {
    handleEscape(evt, () => {
      this._editPointComponent.reset(this._point);
      this._replaceFormToPoint();
    });
  }

  _handleFormRollupButtonClick() {
    document.addEventListener(`keydown`, this._handleKeyDown);
    this._replacePointToForm();
  }

  _handleFavoriteClick() {
    this._changeData(
        ActionType.UPDATE,
        UpdateType.PATCH,
        Object.assign(
            {},
            this._point,
            {
              isFavorite: !this._point.isFavorite
            }
        ),
        true
    );
  }

  _handleFormSubmit(point) {
    const updateType = (point.price !== this._point.price || !compareTimes(point.times.start, this._point.times.start || !compareTimes(point.times.end, this._point.times.end)) || point.destination !== this._point.destination || !compareOffers(point.offers, this._point.offers)) ? UpdateType.MINOR : UpdateType.PATCH;
    this._changeData(ActionType.UPDATE, updateType, point);
  }

  _handleDeletePoint(point) {
    this._changeData(ActionType.DELETE, UpdateType.MAJOR, point);
  }

  _handlePointRollupButtonClick() {
    this._replaceFormToPoint();
  }
}
