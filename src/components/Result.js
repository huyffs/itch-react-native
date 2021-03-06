import React from 'react';
import PropTypes from 'prop-types';
import {View, Text, StyleSheet, Animated, Share} from 'react-native';
import FastImage from 'react-native-fast-image';
import {TextButton} from 'react-native-material-buttons';
import {WALLPAPER_LOAD_REQUEST} from '../actionTypes/wallpaper';
import {createAction} from '../actions';
import {connect, useDispatch} from 'react-redux';
import {LOADED} from '../constants/loading.states';
import Icon from 'react-native-vector-icons/Feather';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import Config from 'react-native-config';
import {Alerter} from './Alerter';
import slugify from 'slugify';
import {Terms} from '../models/Calculator';

let backgroundImageOpacity = new Animated.Value(0);
const fadeIn = () =>
  Animated.timing(backgroundImageOpacity, {
    toValue: 1,
    duration: 600,
    useNativeDriver: true,
  }).start();

function Result({
  id,
  params,
  country,
  variant,
  durations,
  wallpaperUrl,
  onDelete,
}) {
  const sections = [
    {title: 'Year', data: durations.y},
    {title: 'Month', data: durations.m},
    {title: 'Week', data: durations.w},
    {title: 'Day', data: durations.d},
    {title: 'Hour', data: durations.h},
  ];
  const dispatch = useDispatch();
  if (!wallpaperUrl) {
    dispatch(createAction(WALLPAPER_LOAD_REQUEST, id));
  }

  async function getShareLink(url) {
    try {
      return await dynamicLinks().buildShortLink(
        {
          link: url,
          domainUriPrefix: 'https://' + Config.FDL_DOMAIN,
          android: {
            packageName: Config.APPLICATION_ID,
          },
        },
        'SHORT',
      );
    } catch (error) {
      console.log(error);
      Alerter.error(
        'Something went wrong',
        'This is likely to be  a bug - please tell Huy that the share feature is broken. Thanks',
      );
    }
    return '';
  }

  async function share() {
    const link = await getShareLink(
      Config.SHARE_URI_PREFIX +
        '?c=' +
        country.id +
        '&v=' +
        slugify(variant) +
        '&t=' +
        params.term +
        '&r=' +
        params.rate.int +
        params.rate.float +
        '&h=' +
        params.hoursPerDay +
        '&d=' +
        params.daysPerWeek +
        '&l=' +
        params.annualLeave,
    );

    let message =
      (link && link + '\n') +
      country.flag +
      ' ' +
      country.name +
      '\nSalary: ' +
      (country.prefix || '') +
      params.rate.int +
      params.rate.float +
      (country.suffix || '') +
      '/' +
      params.term;
    if (params.term !== Terms.YEARLY) {
      message +=
        ' = ' +
        (country.prefix || '') +
        durations[Terms.YEARLY].gross.int +
        (country.suffix || '');
    }
    message += '\n';
    for (const k in durations[Terms.YEARLY].taxes) {
      const tax = durations[Terms.YEARLY].taxes[k];
      message +=
        '- ' +
        k +
        ': ' +
        (country.prefix || '') +
        tax.int +
        tax.float +
        (country.suffix || '') +
        '\n';
    }
    message +=
      'Real salary: ' +
      (country.prefix || '') +
      durations[Terms.YEARLY].net.int +
      durations[Terms.YEARLY].net.float +
      (country.suffix || '') +
      '\nFor more info download ITCH app';

    try {
      const result = await Share.share({
        title: Config.APP_NAME,
        message: message,
      });

      if (result.action === Share.sharedAction) {
        console.log(`Shared with ${result.activityType}`);
      }
    } catch (error) {
      console.log('Share error:');
      console.log(error);
    }
  }

  return (
    <>
      <Animated.View
        style={[
          {opacity: backgroundImageOpacity},
          styles.backgroundImageHolder,
        ]}>
        <FastImage
          style={styles.backgroundImage}
          onLoad={fadeIn}
          source={{
            uri: wallpaperUrl,
          }}
        />
      </Animated.View>
      <View style={styles.content}>
        <View style={styles.flagContainer}>
          <Text style={styles.flag}>{country.flag}</Text>
        </View>
        <View style={styles.titleHolder}>
          <Text style={styles.title}>{country.name}</Text>
        </View>
        <View style={styles.titleHolder}>
          <Text style={styles.subtitle}>{variant}</Text>
        </View>
        <View style={styles.shareButtonHolder}>
          <Icon.Button
            name="share-2"
            size={30}
            borderRadius={30}
            color="#000"
            backgroundColor="#fff"
            onPress={share}>
            Share
          </Icon.Button>
        </View>
        {sections.map(cat => (
          <View style={styles.section} key={cat.title}>
            <Text style={styles.sectionTitle}>{cat.title}</Text>
            {cat.data.months && (
              <View style={styles.row}>
                <Text style={styles.label}>Work months</Text>
                <Text style={styles.label}>
                  {cat.data.months.int}
                  <Text style={styles.float}>{cat.data.months.float}</Text>
                </Text>
              </View>
            )}
            {cat.data.weeks && (
              <View style={styles.row}>
                <Text style={styles.label}>Work weeks</Text>
                <Text style={styles.label}>
                  {cat.data.weeks.int}
                  <Text style={styles.float}>{cat.data.weeks.float}</Text>
                </Text>
              </View>
            )}
            {cat.data.days && (
              <View style={styles.row}>
                <Text style={styles.label}>Work days</Text>
                <Text style={styles.label}>
                  {cat.data.days.int}
                  <Text style={styles.float}>{cat.data.days.float}</Text>
                </Text>
              </View>
            )}
            {cat.data.hours && (
              <View style={styles.row}>
                <Text style={styles.label}>Work hours</Text>
                <Text style={styles.label}>
                  {cat.data.hours.int}
                  <Text style={styles.float}>{cat.data.hours.float}</Text>
                </Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Leave</Text>
              <Text style={styles.label}>{cat.data.leave}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Before tax</Text>
              <Text style={styles.label}>
                <Text style={styles.currency}>{country.prefix || ''}</Text>
                {cat.data.gross.int}
                <Text style={styles.float}>{cat.data.gross.float}</Text>
                <Text style={styles.currency}>{country.suffix || ''}</Text>
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>After tax</Text>
              <Text style={styles.label}>
                <Text style={styles.currency}>{country.prefix || ''}</Text>
                {cat.data.net.int}
                <Text style={styles.float}>{cat.data.net.float}</Text>
                <Text style={styles.currency}>{country.suffix || ''}</Text>
              </Text>
            </View>
            {Object.keys(cat.data.taxes).length > 1 && (
              <View style={styles.row}>
                <Text style={styles.label}>Total deductions</Text>
                <Text style={styles.label}>
                  <Text style={styles.currency}>{country.prefix || ''}</Text>
                  {cat.data.taxed.int}
                  <Text style={styles.float}>{cat.data.taxed.float}</Text>
                  <Text style={styles.currency}>{country.suffix || ''}</Text>
                </Text>
              </View>
            )}
            {Object.keys(cat.data.taxes).map(label => (
              <View style={styles.row} key={label}>
                <Text style={styles.label}> - {label}</Text>
                <Text style={styles.label}>
                  <Text style={styles.currency}>{country.prefix || ''}</Text>
                  {cat.data.taxes[label].int}
                  <Text style={styles.float}>
                    {cat.data.taxes[label].float}
                  </Text>
                  <Text style={styles.currency}>{country.suffix || ''}</Text>
                </Text>
              </View>
            ))}
          </View>
        ))}
        <View style={styles.buttonHolder}>
          <TextButton
            title="Delete"
            titleColor="#fff"
            titleStyle={styles.buttonTitle}
            onPress={onDelete}
          />
        </View>
      </View>
    </>
  );
}

const mapStateToProps = (state, ownProps) => {
  if (state.wallpaper.hasOwnProperty(ownProps.id)) {
    const meta = state.wallpaper[ownProps.id];
    if (meta.state === LOADED) {
      return {
        wallpaperUrl: state.wallpaper[ownProps.id].data.urls.regular,
      };
    }
  }
  return {};
};

export default connect(mapStateToProps)(Result);

Result.propType = {
  gross: PropTypes.number.isRequired,
  studentLoan: PropTypes.number,
  taxes: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
    }),
  ),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 60,
  },
  backgroundImageHolder: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  backgroundImage: {
    height: '100%',
    width: '100%',
  },
  row: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingTop: 3,
    paddingBottom: 5,
    paddingRight: 5,
    paddingLeft: 5,
    marginTop: 5,
    borderRadius: 6,
  },
  label: {
    fontSize: 18,
  },
  flagContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  flag: {
    fontSize: 128,
    width: 128,
    textAlign: 'center',
  },
  titleHolder: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    padding: 5,
    paddingLeft: 8,
    paddingRight: 8,
    fontSize: 25,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  float: {
    color: '#666',
  },
  currency: {
    color: '#666',
  },
  buttonHolder: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
  },
  buttonTitle: {backgroundColor: '#900'},
  sectionTitle: {
    fontSize: 24,
    marginTop: 10,
  },
  shareButtonHolder: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});
