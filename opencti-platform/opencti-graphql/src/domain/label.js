import { assoc, pipe } from 'ramda';
import { delEditContext, notify, setEditContext } from '../database/redis';
import { createEntity, deleteElementById, listEntities, loadById, updateAttribute } from '../database/grakn';
import { BUS_TOPICS } from '../config/conf';
import { ENTITY_TYPE_LABEL } from '../schema/stixMetaObject';
import { normalizeName } from '../schema/identifier';

export const findById = (labelId) => {
  return loadById(labelId, ENTITY_TYPE_LABEL);
};

export const findAll = (args) => {
  return listEntities([ENTITY_TYPE_LABEL], ['value'], args);
};

export const stringToColour = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let colour = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += `00${value.toString(16)}`.substr(-2);
  }
  return colour;
};

export const addLabel = async (user, label) => {
  const finalLabel = pipe(
    assoc('value', normalizeName(label.value).toLowerCase()),
    assoc('color', label.color ? label.color : stringToColour(normalizeName(label.value)))
  )(label);
  const created = await createEntity(user, finalLabel, ENTITY_TYPE_LABEL);
  return notify(BUS_TOPICS[ENTITY_TYPE_LABEL].ADDED_TOPIC, created, user);
};

export const labelDelete = (user, labelId) => deleteElementById(user, labelId, ENTITY_TYPE_LABEL);

export const labelEditField = async (user, labelId, input) => {
  const label = await updateAttribute(user, labelId, ENTITY_TYPE_LABEL, input);
  return notify(BUS_TOPICS[ENTITY_TYPE_LABEL].EDIT_TOPIC, label, user);
};

export const labelCleanContext = async (user, labelId) => {
  await delEditContext(user, labelId);
  return loadById(labelId, ENTITY_TYPE_LABEL).then((label) =>
    notify(BUS_TOPICS[ENTITY_TYPE_LABEL].EDIT_TOPIC, label, user)
  );
};

export const labelEditContext = async (user, labelId, input) => {
  await setEditContext(user, labelId, input);
  return loadById(labelId, ENTITY_TYPE_LABEL).then((label) =>
    notify(BUS_TOPICS[ENTITY_TYPE_LABEL].EDIT_TOPIC, label, user)
  );
};
