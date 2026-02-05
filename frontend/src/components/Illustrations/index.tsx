/**
 * Illustration components – SVG illustrations as React components.
 * Powered by vite-plugin-svgr. Use for consistent, styleable illustrations.
 *
 * Usage:
 *   import { Illustrations } from '../components/Illustrations';
 *   <Illustrations.SkinToday className="today-ill today-ill-section" aria-hidden />
 */

import React from 'react';

import ArrowRightSvg from '../../assets/illustrations/arrow-right.svg?react';
import CartSvg from '../../assets/illustrations/cart.svg?react';
import CheckSvg from '../../assets/illustrations/check.svg?react';
import ConcernsSvg from '../../assets/illustrations/concerns.svg?react';
import HistoryChartSvg from '../../assets/illustrations/history-chart.svg?react';
import IngredientsSvg from '../../assets/illustrations/ingredients.svg?react';
import PackageSvg from '../../assets/illustrations/package.svg?react';
import RecommendedSvg from '../../assets/illustrations/recommended.svg?react';
import RoutineMoonSvg from '../../assets/illustrations/routine-moon.svg?react';
import RoutineSunSvg from '../../assets/illustrations/routine-sun.svg?react';
import ScanCameraSvg from '../../assets/illustrations/scan-camera.svg?react';
import SkinTodaySvg from '../../assets/illustrations/skin-today.svg?react';
import EmptyShelfSvg from '../../assets/illustrations/empty-shelf.svg?react';

export type IllustrationProps = React.SVGProps<SVGSVGElement>;

function withIllustration(
  Svg: React.FunctionComponent<React.SVGProps<SVGSVGElement>>,
  displayName: string
) {
  const Component = (props: IllustrationProps) => <Svg {...props} aria-hidden />;
  Component.displayName = displayName;
  return Component;
}

/* eslint-disable react-refresh/only-export-components -- Illustrations is a component map */
export const Illustrations = {
  ArrowRight: withIllustration(ArrowRightSvg, 'Illustrations.ArrowRight'),
  Cart: withIllustration(CartSvg, 'Illustrations.Cart'),
  Check: withIllustration(CheckSvg, 'Illustrations.Check'),
  Concerns: withIllustration(ConcernsSvg, 'Illustrations.Concerns'),
  HistoryChart: withIllustration(HistoryChartSvg, 'Illustrations.HistoryChart'),
  Ingredients: withIllustration(IngredientsSvg, 'Illustrations.Ingredients'),
  Package: withIllustration(PackageSvg, 'Illustrations.Package'),
  Recommended: withIllustration(RecommendedSvg, 'Illustrations.Recommended'),
  RoutineMoon: withIllustration(RoutineMoonSvg, 'Illustrations.RoutineMoon'),
  RoutineSun: withIllustration(RoutineSunSvg, 'Illustrations.RoutineSun'),
  ScanCamera: withIllustration(ScanCameraSvg, 'Illustrations.ScanCamera'),
  SkinToday: withIllustration(SkinTodaySvg, 'Illustrations.SkinToday'),
  EmptyShelf: withIllustration(EmptyShelfSvg, 'Illustrations.EmptyShelf'),
};

export default Illustrations;
