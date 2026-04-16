import { h } from "preact";
import mimirIcon from "../../mimir-48px.png";

export function Header() {
  return (
    <div class="header">
      <img src={mimirIcon} class="header__icon" alt="" aria-hidden="true" />
      <div class="header__text">
        <div class="header__title">Mimir</div>
        <div class="header__subtitle">Add semantic tags to icon components</div>
      </div>
    </div>
  );
}
