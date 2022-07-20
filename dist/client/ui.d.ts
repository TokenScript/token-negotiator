import { Client } from "./index";
import { ViewInterface, ViewConstructor, AbstractView } from "./views/view-interface";
export declare type UIType = "popup" | "inline";
export interface UIOptionsInterface {
    uiType?: UIType;
    containerElement?: string;
    openingHeading?: string;
    issuerHeading?: string;
    repeatAction?: string;
    theme?: string;
    position?: string;
    autoPopup?: boolean;
}
export declare class Ui {
    private static UI_CONTAINER_HTML;
    private static FAB_BUTTON_HTML;
    options?: UIOptionsInterface;
    client: Client;
    popupContainer: any;
    viewContainer: any;
    loadContainer: any;
    currentView: ViewInterface | undefined;
    retryCallback?: Function;
    retryButton: any;
    constructor(options: UIOptionsInterface, client: Client);
    initialize(): void;
    initializeUIType(): void;
    closeOverlay(): void;
    openOverlay(): void;
    togglePopup(): void;
    updateUI(ViewClass: ViewConstructor<AbstractView>, data?: any): void;
    showError(message: string, canDismiss?: boolean): void;
    setErrorRetryCallback(retryCallback?: Function): void;
    showLoader(...message: string[]): void;
    dismissLoader(): void;
    private addTheme;
    private assignFabButtonAnimation;
}
