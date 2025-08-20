import {Fragment} from 'react';
import styled from '@emotion/styled';

import {SelectOption} from 'sentry/components/core/select/option';
import type {components} from 'sentry/components/forms/controls/reactSelectWrapper';
import type {JsonFormObject} from 'sentry/components/forms/types';
import languages from 'sentry/data/languages';
import {timezoneOptions} from 'sentry/data/timezones';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {StacktraceOrder} from 'sentry/types/user';
import {removeBodyTheme} from 'sentry/utils/removeBodyTheme';

// Export route to make these forms searchable by label/help
export const route = '/settings/account/details/';

// Styled components for color preview
const ColorPreview = styled('div')<{color: string}>`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background-color: ${p => p.color};
  border: 1px solid ${p => p.theme.border};
  margin-right: ${space(1)};
  flex-shrink: 0;
`;

// Custom Option component that shows color previews
function ThemeColorOption(props: React.ComponentProps<typeof components.Option>) {
  const {data} = props;
  const isColorValue = data.value?.startsWith('#');

  return (
    <SelectOption
      {...props}
      data={{
        ...data,
        leadingItems: isColorValue ? (
          <Fragment>
            <ColorPreview color={data.value} />
            {data.leadingItems}
          </Fragment>
        ) : (
          data.leadingItems
        ),
      }}
    />
  );
}

// Called before sending API request, these fields need to be sent as an
// `options` object
const transformOptions = (data: Record<PropertyKey, unknown>) => ({options: data});

// Transform custom theme data - when customTheme is 'custom', use customThemeColor value
const transformCustomTheme = (
  data: Record<PropertyKey, unknown>,
  context?: {form?: any; model?: any}
) => {
  const formData = context?.form || {};
  const customTheme = formData.customTheme;
  const customThemeColor = formData.customThemeColor;

  // Create transformed data excluding customThemeColor to avoid duplication
  const transformedData = Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== 'customThemeColor')
  );

  // If customTheme is 'custom', send the hex color as the customTheme value
  if (customTheme === 'custom' && customThemeColor) {
    transformedData.customTheme = customThemeColor;
  } else if (customTheme && customTheme !== 'default') {
    // For preset colors (which are already hex values) or other non-default values
    transformedData.customTheme = customTheme;
  } else if (customTheme === 'default') {
    // For default, we might want to omit customTheme or set it to a specific value
    transformedData.customTheme = 'default';
  }

  return {options: transformedData};
};

const formGroups: JsonFormObject[] = [
  {
    // Form "section"/"panel"
    title: 'Appearance',
    fields: [
      {
        name: 'theme',
        type: 'select',
        label: t('Color Mode'),
        help: t(
          "Select your theme preference. It can be synced to your system's theme, always light mode, or always dark mode."
        ),
        options: [
          {value: 'light', label: t('Light')},
          {value: 'dark', label: t('Dark')},
          {value: 'system', label: t('Default to system')},
        ],
        getData: transformOptions,
        onChange: () => {
          removeBodyTheme();
        },
      },
      {
        name: 'customTheme',
        type: 'select',
        label: t('Custom Theme'),
        help: t('Choose default theme or customize with your own color'),
        options: [
          {value: 'default', label: t('Default')},
          {value: '#809848', label: t('Squashed Bug')},
          {value: '#f7b538', label: t('Rubber Ducky')},
          {value: '#FFDDE2', label: t('Cherry Blossom')},
          {value: '#6A7FDB', label: t('Tech Bro')},
          {value: 'custom', label: t('Custom')},
        ],
        getData: transformCustomTheme,
        components: {
          Option: ThemeColorOption,
        },
      } as any,
      {
        name: 'customThemeColor',
        type: 'string',
        label: t('Custom Theme Color'),
        help: t('Enter a custom theme color in hex format (e.g., #ff5722)'),
        placeholder: '#ff5722',
        visible: ({model}) => model?.getValue('customTheme') === 'custom',
        getData: transformCustomTheme, // Use same transform function to ensure both fields trigger the transformation
        validate: ({form}) => {
          const customTheme = form?.customTheme;
          const customThemeColor = form?.customThemeColor;

          // Only validate customThemeColor when customTheme is 'custom'
          if (customTheme === 'custom') {
            if (!customThemeColor || customThemeColor.trim() === '') {
              return [
                [
                  'customThemeColor',
                  'Please provide a hex color when selecting custom theme',
                ],
              ];
            }

            // Basic hex color validation
            if (!/^#[0-9A-Fa-f]{6}$/.test(customThemeColor.trim())) {
              return [
                ['customThemeColor', 'Please enter a valid hex color (e.g., #ff5722)'],
              ];
            }
          }

          return [];
        },
      },
    ],
  },
  {
    // Form "section"/"panel"
    title: 'Preferences',
    fields: [
      {
        name: 'language',
        type: 'select',
        label: t('Language'),
        options: languages.map(([value, label]) => ({value, label})),
        getData: transformOptions,
      },
      {
        name: 'timezone',
        type: 'select',
        label: t('Timezone'),
        options: timezoneOptions,
        getData: transformOptions,
      },
      {
        name: 'clock24Hours',
        type: 'boolean',
        label: t('Use a 24-hour clock'),
        getData: transformOptions,
      },
      {
        name: 'stacktraceOrder',
        type: 'select',
        required: false,
        options: [
          // TODO: If we eliminate the special-casing as discussed in
          // https://github.com/getsentry/sentry/pull/96719, consider changing the label here to
          // `Default (newest first)` and removing the separate `Newest first` option.
          {value: StacktraceOrder.DEFAULT, label: t('Default')},
          {value: StacktraceOrder.MOST_RECENT_LAST, label: t('Oldest first')},
          {value: StacktraceOrder.MOST_RECENT_FIRST, label: t('Newest first')},
        ],
        label: t('Stack Trace Order'),
        help: t('Choose the default ordering of frames in stack traces'),
        getData: transformOptions,
      },
      {
        name: 'defaultIssueEvent',
        type: 'select',
        required: false,
        options: [
          {value: 'recommended', label: t('Recommended')},
          {value: 'latest', label: t('Latest')},
          {value: 'oldest', label: t('Oldest')},
        ],
        label: t('Default Issue Event'),
        help: t('Choose what event gets displayed by default'),
        getData: transformOptions,
      },
    ],
  },
];

export default formGroups;
