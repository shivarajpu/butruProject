/**
 * Widget registry — the only place a widget `type` string is mapped to a
 * component.
 *
 * Adding support for a new backend widget type is a one-line change here. The
 * renderer never switches on `type` itself, and no screen hardcodes an
 * `order` / `visibility` / `config` value.
 *
 * `customisationFlow` is enforced here (and not only inside the components) so
 * a section switched off in the admin panel disappears even if its widget
 * definition is still marked `live`.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import type { StoreWidget, WidgetType } from '../storefront/types';
import { selectFeatures } from '../storefront/selectors';
import { BannerWidget, HeroCardsWidget } from './home/BannerWidget';
import ProductGroupWidget from './home/ProductGroupWidget';
import { DealOfTheDayWidget, OfferCardsWidget } from './home/OfferWidgets';
import {
  FashionSectionWidget,
  GirlsBoysFashionWidget,
  PartyPosterWidget,
} from './home/MarketingWidgets';
import TestimonialWidget from './home/TestimonialWidget';
import NewsletterWidget from './home/NewsletterWidget';
import {
  ProductColourPickerWidget,
  ProductMediaWidget,
  ProductSizePickerWidget,
  ProductTitleWidget,
  WhatsAppBagWidget,
  type ProductWidgetProduct,
} from './product/ProductWidgets';

export type WidgetComponent = React.ComponentType<{
  widget: StoreWidget;
  product?: ProductWidgetProduct | undefined;
}>;

const REGISTRY: Record<WidgetType, WidgetComponent> = {
  banner_cross_link: BannerWidget,
  hero_cards: HeroCardsWidget,
  product_group: ProductGroupWidget,
  deal_of_the_day: DealOfTheDayWidget,
  girls_boys_fashion: GirlsBoysFashionWidget,
  offer_cards: OfferCardsWidget,
  party_poster: PartyPosterWidget,
  fashion_section: FashionSectionWidget,
  product_testimonial: TestimonialWidget,
  newsletter: NewsletterWidget,
  product_media: ProductMediaWidget,
  product_title: ProductTitleWidget,
  product_size_picker: ProductSizePickerWidget,
  product_colour_picker: ProductColourPickerWidget,
  wa_reply_and_bag: WhatsAppBagWidget,
};

/** Widget types that need a product in context (product / out-of-stock pages). */
const PRODUCT_WIDGETS: WidgetType[] = [
  'product_media',
  'product_title',
  'product_size_picker',
  'product_colour_picker',
  'wa_reply_and_bag',
];

/** `customisationFlow` flag that must be on for a widget type to render. */
const FEATURE_GATE: Partial<Record<WidgetType, 'sizeEnabled' | 'colourEnabled' | 'showWhatsappBag'>> = {
  product_size_picker: 'sizeEnabled',
  product_colour_picker: 'colourEnabled',
  wa_reply_and_bag: 'showWhatsappBag',
};

export type DynamicWidgetProps = {
  widget: StoreWidget;
  product?: ProductWidgetProduct;
};

/**
 * Renders one widget. Returns `null` for unknown types, for widgets whose
 * feature flag is off, and for product widgets without a product.
 */
const DynamicWidget = ({ widget, product }: DynamicWidgetProps) => {
  const features = useSelector(selectFeatures);
  const Component = REGISTRY[widget.type];
  if (!Component) return null;

  const gate = FEATURE_GATE[widget.type];
  if (gate && !features[gate]) return null;

  if (PRODUCT_WIDGETS.includes(widget.type) && !product) return null;

  return <Component widget={widget} product={product} />;
};

export default DynamicWidget;
export { REGISTRY, PRODUCT_WIDGETS, FEATURE_GATE };
