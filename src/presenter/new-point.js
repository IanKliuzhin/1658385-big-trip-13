import PointEditorView from '../view/point-editor';
import {render, RenderPosition, remove} from '../utils/render';
import {UpdateType, ActionType} from '../const';
import {handleEscape, getIsOnline} from '../utils/common';

export default class NewPointPresenter {
  constructor(pointsListElement, changeData, newEventButton, destinationsModel, offersModel) {
    this._pointsListElement = pointsListElement;
    this._changeData = changeData;
    this._newEventButton = newEventButton;
    this._destinationsModel = destinationsModel;
    this._offersModel = offersModel;

    this._editPointComponent = null;

    this._handleFormSubmit = this._handleFormSubmit.bind(this);
    this._handleCancelClick = this._handleCancelClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  init() {
    if (this._editPointComponent !== null) {
      return;
    }

    this._newEventButton.disabled = true;

    this._editPointComponent = new PointEditorView(this._destinationsModel.destinations, this._offersModel.offers, this._destinationsModel.getDescription);
    this._editPointComponent.setFormSubmitHandler(this._handleFormSubmit);
    this._editPointComponent.setDeleteClickHandler(this._handleCancelClick);

    render(this._pointsListElement, this._editPointComponent, RenderPosition.AFTERBEGIN);

    document.addEventListener(`keydown`, this._handleKeyDown);
  }

  destroy() {
    if (this._editPointComponent === null) {
      return;
    }

    remove(this._editPointComponent);
    this._editPointComponent = null;

    document.removeEventListener(`keydown`, this._handleKeyDown);

    if (getIsOnline()) {
      this._newEventButton.disabled = false;
    }
  }

  setIsSaving() {
    this._editPointComponent.updateData({
      isDisabled: true,
      isSaving: true
    });
  }

  setIsDisabled(isDisabled) {
    if (this._editPointComponent === null) {
      return;
    }

    this._editPointComponent.updateData({
      isDisabled
    });
  }

  resetStateWithShake() {
    const resetFormState = () => {
      this._editPointComponent.updateData({
        isDisabled: !getIsOnline(),
        isSaving: false,
        isDeleting: false
      });
    };

    this._editPointComponent.shake(resetFormState);
  }

  _handleFormSubmit(point) {
    this._changeData(
        ActionType.ADD,
        UpdateType.MINOR,
        point
    );
  }

  _handleCancelClick() {
    this.destroy();
  }

  _handleKeyDown(evt) {
    handleEscape(evt, () => {
      this.destroy();
    });
  }
}
