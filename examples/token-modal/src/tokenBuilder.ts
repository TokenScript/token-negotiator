// ModalComponents
// Components that are designed to be rendered within the modal
import tokenImage from './img/button.svg';

export const tokenBuilder = (data:any, index:number) => {
  return `
      <div class='token'>
        <div class='content'>
          <svg class='emblem' src=${tokenImage} />
          <div class='data'>
            <p class='title'>Devcon Ticket #${index+1}</p>
            <p class='detail'>Discount for Hotels and VIP Section</p>
          </div>
        </div>
        <div class='toggle'>
          <input onClick='tokenSelection(event)' data-index='${index}' data-token='${JSON.stringify(data)}' type='checkbox' name='toggle${index}' class='mobileToggle' id='toggle${index}'>
          <label for='toggle${index}'></label>
        </div>
      </div>
    `;
}



export default tokenBuilder;