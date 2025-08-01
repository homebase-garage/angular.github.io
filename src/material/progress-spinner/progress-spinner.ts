/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  Input,
  ViewChild,
  ViewEncapsulation,
  numberAttribute,
  inject,
} from '@angular/core';
import {_getAnimationsState, ThemePalette} from '../core';
import {NgTemplateOutlet} from '@angular/common';

/** Possible mode for a progress spinner. */
export type ProgressSpinnerMode = 'determinate' | 'indeterminate';

/** Default `mat-progress-spinner` options that can be overridden. */
export interface MatProgressSpinnerDefaultOptions {
  /**
   * Default theme color of the progress spinner. This API is supported in M2 themes only, it
   * has no effect in M3 themes. For color customization in M3, see https://material.angular.dev/components/progress-spinner/styling.
   *
   * For information on applying color variants in M3, see
   * https://material.angular.dev/guide/material-2-theming#optional-add-backwards-compatibility-styles-for-color-variants
   */
  color?: ThemePalette;
  /** Diameter of the spinner. */
  diameter?: number;
  /** Width of the spinner's stroke. */
  strokeWidth?: number;
  /**
   * Whether the animations should be force to be enabled, ignoring if the current environment is
   * using NoopAnimationsModule.
   */
  _forceAnimations?: boolean;
}

/** Injection token to be used to override the default options for `mat-progress-spinner`. */
export const MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS =
  new InjectionToken<MatProgressSpinnerDefaultOptions>('mat-progress-spinner-default-options', {
    providedIn: 'root',
    factory: MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS_FACTORY,
  });

/**
 * @docs-private
 * @deprecated No longer used, will be removed.
 * @breaking-change 21.0.0
 */
export function MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS_FACTORY(): MatProgressSpinnerDefaultOptions {
  return {diameter: BASE_SIZE};
}

/**
 * Base reference size of the spinner.
 */
const BASE_SIZE = 100;

/**
 * Base reference stroke width of the spinner.
 */
const BASE_STROKE_WIDTH = 10;

@Component({
  selector: 'mat-progress-spinner, mat-spinner',
  exportAs: 'matProgressSpinner',
  host: {
    'role': 'progressbar',
    'class': 'mat-mdc-progress-spinner mdc-circular-progress',
    // set tab index to -1 so screen readers will read the aria-label
    // Note: there is a known issue with JAWS that does not read progressbar aria labels on FireFox
    'tabindex': '-1',
    '[class]': '"mat-" + color',
    '[class._mat-animation-noopable]': `_noopAnimations`,
    '[class.mdc-circular-progress--indeterminate]': 'mode === "indeterminate"',
    '[style.width.px]': 'diameter',
    '[style.height.px]': 'diameter',
    '[style.--mat-progress-spinner-size]': 'diameter + "px"',
    '[style.--mat-progress-spinner-active-indicator-width]': 'diameter + "px"',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'mode === "determinate" ? value : null',
    '[attr.mode]': 'mode',
  },
  templateUrl: 'progress-spinner.html',
  styleUrl: 'progress-spinner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet],
})
export class MatProgressSpinner {
  readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Whether the _mat-animation-noopable class should be applied, disabling animations.  */
  _noopAnimations: boolean;

  // TODO: should be typed as `ThemePalette` but internal apps pass in arbitrary strings.
  /**
   * Theme color of the progress spinner. This API is supported in M2 themes only, it
   * has no effect in M3 themes. For color customization in M3, see https://material.angular.dev/components/progress-spinner/styling.
   *
   * For information on applying color variants in M3, see
   * https://material.angular.dev/guide/material-2-theming#optional-add-backwards-compatibility-styles-for-color-variants
   */
  @Input()
  get color() {
    return this._color || this._defaultColor;
  }
  set color(value: string | null | undefined) {
    this._color = value;
  }
  private _color: string | null | undefined;
  private _defaultColor: ThemePalette = 'primary';

  /** The element of the determinate spinner. */
  @ViewChild('determinateSpinner') _determinateCircle: ElementRef<HTMLElement>;

  constructor(...args: unknown[]);

  constructor() {
    const defaults = inject<MatProgressSpinnerDefaultOptions>(MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS);
    const animationsState = _getAnimationsState();
    const element = this._elementRef.nativeElement;

    this._noopAnimations =
      animationsState === 'di-disabled' && !!defaults && !defaults._forceAnimations;
    this.mode = element.nodeName.toLowerCase() === 'mat-spinner' ? 'indeterminate' : 'determinate';

    if (!this._noopAnimations && animationsState === 'reduced-motion') {
      element.classList.add('mat-progress-spinner-reduced-motion');
    }

    if (defaults) {
      if (defaults.color) {
        this.color = this._defaultColor = defaults.color;
      }

      if (defaults.diameter) {
        this.diameter = defaults.diameter;
      }

      if (defaults.strokeWidth) {
        this.strokeWidth = defaults.strokeWidth;
      }
    }
  }

  /**
   * Mode of the progress bar.
   *
   * Input must be one of these values: determinate, indeterminate, buffer, query, defaults to
   * 'determinate'.
   * Mirrored to mode attribute.
   */
  @Input() mode: ProgressSpinnerMode;

  /** Value of the progress bar. Defaults to zero. Mirrored to aria-valuenow. */
  @Input({transform: numberAttribute})
  get value(): number {
    return this.mode === 'determinate' ? this._value : 0;
  }
  set value(v: number) {
    this._value = Math.max(0, Math.min(100, v || 0));
  }
  private _value = 0;

  /** The diameter of the progress spinner (will set width and height of svg). */
  @Input({transform: numberAttribute})
  get diameter(): number {
    return this._diameter;
  }
  set diameter(size: number) {
    this._diameter = size || 0;
  }
  private _diameter = BASE_SIZE;

  /** Stroke width of the progress spinner. */
  @Input({transform: numberAttribute})
  get strokeWidth(): number {
    return this._strokeWidth ?? this.diameter / 10;
  }
  set strokeWidth(value: number) {
    this._strokeWidth = value || 0;
  }
  private _strokeWidth: number;

  /** The radius of the spinner, adjusted for stroke width. */
  _circleRadius(): number {
    return (this.diameter - BASE_STROKE_WIDTH) / 2;
  }

  /** The view box of the spinner's svg element. */
  _viewBox() {
    const viewBox = this._circleRadius() * 2 + this.strokeWidth;
    return `0 0 ${viewBox} ${viewBox}`;
  }

  /** The stroke circumference of the svg circle. */
  _strokeCircumference(): number {
    return 2 * Math.PI * this._circleRadius();
  }

  /** The dash offset of the svg circle. */
  _strokeDashOffset() {
    if (this.mode === 'determinate') {
      return (this._strokeCircumference() * (100 - this._value)) / 100;
    }
    return null;
  }

  /** Stroke width of the circle in percent. */
  _circleStrokeWidth() {
    return (this.strokeWidth / this.diameter) * 100;
  }
}

/**
 * @deprecated Import Progress Spinner instead. Note that the
 *    `mat-spinner` selector isn't deprecated.
 * @breaking-change 16.0.0
 */
// tslint:disable-next-line:variable-name
export const MatSpinner = MatProgressSpinner;
