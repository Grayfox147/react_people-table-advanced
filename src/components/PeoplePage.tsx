/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMatch, useSearchParams } from 'react-router-dom';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
// import debounce from 'lodash.debounce';
import { PeopleFilters } from './PeopleFilters';
import { Loader } from './Loader';
import { PeopleTable } from './PeopleTable';
import { Person } from '../types';
import { Errors, getPeople } from '../api';
import { baseCenturies } from '../utils/searchHelper';

export const PeoplePage: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorLoading, setErrorLoading] = useState('');
  const match = useMatch('/people/:personSlug');
  const personSlugSelected = match?.params.personSlug;
  const [searchParams] = useSearchParams();
  const sex = searchParams.get('sex');
  const centuries = searchParams
    .getAll('centuries') || baseCenturies;
  const query = searchParams.get('query');

  // const debouncedQuery = useCallback(
  //   debounce(
  //     setSearchParams,
  //     1000,
  //   ), [],
  // );

  useEffect(() => {
    setIsLoading(true);
    getPeople()
      .then((peopleData) => {
        setPeople(peopleData);
        setIsLoaded(true);
      })
      .catch(() => {
        setErrorLoading(Errors.LOADING);
        setIsLoaded(false);
      })
      .finally(() => (
        setIsLoading(false)
      ));
  }, []);

  const showTable = !isLoading
    && isLoaded
    && !errorLoading
    && people.length > 0;

  const peopleByCentury = useMemo(() => (
    centuries.length
      ? people.filter((person) => (
        centuries.includes(Math.ceil(person.born / 100).toString())))
      : people
  ), [centuries]);

  const peopleByGender = useMemo(() => (
    sex
      ? peopleByCentury.filter((person) => {
        switch (sex) {
          case 'm':
            return person.sex === 'm';
          case 'f':
            return person.sex === 'f';
          default:
            return person;
        }
      })
      : peopleByCentury
  ), [sex, peopleByCentury]);

  const visiblePeople = useMemo(() => (
    query
      ? peopleByGender.filter((person) => {
        const input = query.toLocaleLowerCase().trim();

        const name = person.name.toLocaleLowerCase();
        const mothersName = person.motherName?.toLocaleLowerCase();
        const fathersName = person.fatherName?.toLocaleLowerCase();

        return name.includes(input)
          || mothersName?.includes(input) || fathersName?.includes(input);
      })
      : peopleByGender
  ), [query, peopleByGender]);

  return (
    <>
      <h1 className="title">People Page</h1>

      <div className="block">
        <div className="columns is-desktop is-flex-direction-row-reverse">
          <div className="column is-7-tablet is-narrow-desktop">
            {showTable && (
              <PeopleFilters />
            )}
          </div>

          <div className="column">
            <div className="box table-container">
              {errorLoading && (
                <p
                  data-cy="peopleLoadingError"
                  className="has-text-danger"
                >
                  {errorLoading}
                </p>
              )}
              {isLoading && (<Loader />)}
              {isLoaded && people.length === 0
                && (
                  <p
                    data-cy="noPeopleMessage"
                  >
                    {Errors.EMPTY}
                  </p>
                )}
              {showTable && (
                <PeopleTable
                  people={visiblePeople}
                  personSlugSelected={personSlugSelected}
                />
              )}
              {!visiblePeople.length && (
                <p>There are no people matching the current search criteria</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
