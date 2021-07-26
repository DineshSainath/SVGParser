#include "GPXParser.h"

GPXdoc* createGPXdoc(char* fileName)
{
    if (fileName == NULL) return NULL;
    xmlDocPtr doc = xmlReadFile(fileName, NULL, 0);
    if (doc == NULL) return NULL;

    GPXdoc *gpxdoc = malloc(sizeof(GPXdoc));
    if (gpxdoc == NULL)
    {
        xmlFreeDoc(doc);
        return NULL;
    }
    gpxdoc->creator = NULL;
    gpxdoc->routes = NULL;
    gpxdoc->tracks = NULL;
    gpxdoc->waypoints = NULL;
    xmlNodePtr ptr = xmlDocGetRootElement(doc);
    strcpy(gpxdoc->namespace, (char *) ptr->ns->href);

    int got_creator = 0;
    xmlAttrPtr attr = ptr->properties;
    while (attr)
    {
        if (strcmp((char *)attr->name, "version") == 0)
        {
            xmlChar *value = xmlNodeListGetString(doc, attr->children, 0);
            gpxdoc->version = strtod((char *)value, NULL);
            xmlFree(value);
        }
        else if (strcmp((char *)attr->name, "creator") == 0)
        {
            xmlChar *value = xmlNodeListGetString(doc, attr->children, 0);
            gpxdoc->creator = malloc(strlen((char *)value) + 1);
            if (gpxdoc->creator == NULL)
            {
                xmlFree(value);
                xmlFreeDoc(doc);
                deleteGPXdoc(gpxdoc);
                return NULL;
            }
            strcpy(gpxdoc->creator, (char *)value);
            xmlFree(value);
            got_creator = 1;
        }
        attr = attr->next;
    }
    if (got_creator == 0)
    {
        gpxdoc->creator = malloc(1);
        if (gpxdoc->creator == NULL)
        {
            xmlFreeDoc(doc);
            deleteGPXdoc(gpxdoc);
            return NULL;
        }
        gpxdoc->creator[0] = '\0';
    }

    gpxdoc->waypoints = initializeList(waypointToString, deleteWaypoint, compareWaypoints);
    gpxdoc->tracks = initializeList(trackToString, deleteTrack, compareTracks);
    gpxdoc->routes = initializeList(routeToString, deleteRoute, compareRoutes);
    if (gpxdoc->waypoints == NULL || gpxdoc->tracks == NULL || gpxdoc->routes == NULL)
    {
        xmlFreeDoc(doc);
        deleteGPXdoc(gpxdoc);
        return NULL;
    }
    xmlNodePtr node = ptr->children;
    while (node)
    {
        if (strcmp((char *)node->name, "wpt") == 0)
        {
            Waypoint *wpt = malloc(sizeof(Waypoint));
            if (wpt == NULL)
            {
                xmlFreeDoc(doc);
                deleteGPXdoc(gpxdoc);
                return NULL;
            }

            wpt->name = NULL;
            wpt->otherData = NULL;

            wpt->otherData = initializeList(gpxDataToString, deleteGpxData, compareGpxData);
            if (wpt->otherData == NULL)
            {
                free(wpt);
                xmlFreeDoc(doc);
                deleteGPXdoc(gpxdoc);
                return NULL;
            }
            attr = node->properties;
            while (attr)
            {
                if (strcmp((char *)attr->name, "lat") == 0)
                {
                    xmlChar *value = xmlNodeListGetString(doc, attr->children, 0);
                    wpt->latitude = strtod((char *)value, NULL);
                    xmlFree(value);
                }
                else if (strcmp((char *)attr->name, "lon") == 0)
                {
                    xmlChar *value = xmlNodeListGetString(doc, attr->children, 0);
                    wpt->longitude = strtod((char *)value, NULL);
                    xmlFree(value);
                }
                attr = attr->next;
            }

            int gotName = 0;
            xmlNodePtr nodechild = node->children;
            while (nodechild)
            {
                if (strcmp((char *)nodechild->name, "name") == 0)
                {
                    xmlChar *value = xmlNodeListGetString(doc, nodechild->children, 0);
                    wpt->name = malloc(strlen((char *)value) + 1);
                    if (wpt->name == NULL)
                    {
                        free(wpt);
                        xmlFree(value);
                        xmlFreeDoc(doc);
                        deleteGPXdoc(gpxdoc);
                        return NULL;
                    }

                    strcpy(wpt->name,(char *) value);
                    xmlFree(value);
                    gotName = 1;
                }
                else
                {
                    xmlChar *value = xmlNodeListGetString(doc, nodechild->children, 0);
                    if (value != NULL)
                    {
                        GPXData *data = malloc(sizeof(GPXData) + strlen((char *)value) + 1);
                        if (data == NULL)
                        {
                            free(wpt);
                            xmlFree(value);
                            xmlFreeDoc(doc);
                            deleteGPXdoc(gpxdoc);
                            return NULL;
                        }

                        strcpy(data->name,(char *) nodechild->name);
                        strcpy(data->value,(char *) value);
                        insertBack(wpt->otherData, data);
                        xmlFree(value);
                    }
                }

                nodechild = nodechild->next;
            }

            if (gotName == 0)
            {
                wpt->name = malloc(1);
                if (wpt->name == NULL)
                {
                    free(wpt);
                    xmlFreeDoc(doc);
                    deleteGPXdoc(gpxdoc);
                    return NULL;
                }
                wpt->name[0] = '\0';
            }
            insertBack(gpxdoc->waypoints, wpt);
        }
        else if (strcmp((char *)node->name, "trk") == 0)
        {
            Track *trk = malloc(sizeof(Track));
            if (trk == NULL)
            {
                xmlFreeDoc(doc);
                deleteGPXdoc(gpxdoc);
                return NULL;
            }
            trk->name = NULL;
            trk->otherData = NULL;
            trk->segments = NULL;

            trk->otherData = initializeList(gpxDataToString, deleteGpxData, compareGpxData);
            trk->segments = initializeList(trackSegmentToString, deleteTrackSegment, compareTrackSegments);
            if (trk->otherData == NULL)
            {
                free(trk);
                xmlFreeDoc(doc);
                deleteGPXdoc(gpxdoc);
                return NULL;
            }

            int gotName = 0;
            xmlNodePtr nodechild = node->children;
            while (nodechild)
            {
                if (strcmp((char *)nodechild->name, "name") == 0)
                {
                    xmlChar *value = xmlNodeListGetString(doc, nodechild->children, 0);
                    trk->name = malloc(strlen((char *)value) + 1);
                    if (trk->name == NULL)
                    {
                        free(trk);
                        xmlFreeDoc(doc);
                        deleteGPXdoc(gpxdoc);
                        return NULL;
                    }
                    strcpy(trk->name,(char *) value);
                    xmlFree(value);
                    gotName = 1;
                }
                else if (strcmp((char *)nodechild->name, "trkseg") == 0)
                {
                    TrackSegment *trkseg = malloc(sizeof(TrackSegment));
                    if (trkseg == NULL)
                    {
                        free(trk);
                        xmlFreeDoc(doc);
                        deleteGPXdoc(gpxdoc);
                        return NULL;
                    }

                    trkseg->waypoints = initializeList(waypointToString, deleteWaypoint, compareWaypoints);
                    if (trkseg->waypoints == NULL)
                    {
                        free(trk);
                        xmlFreeDoc(doc);
                        deleteGPXdoc(gpxdoc);
                        return NULL;
                    }

                    xmlNodePtr nodechildchild = nodechild->children;
                    while (nodechildchild)
                    {
                        if (strcmp((char *)nodechildchild->name, "trkpt") == 0)
                        {
                            Waypoint *wpt = malloc(sizeof(Waypoint));
                            if (wpt == NULL)
                            {
                                free(trk);
                                xmlFreeDoc(doc);
                                deleteGPXdoc(gpxdoc);
                                return NULL;
                            }
                            
                            wpt->name = malloc(1);
                            wpt->otherData = initializeList(waypointToString, deleteWaypoint, compareWaypoints);
                            if (wpt->name == NULL || wpt->otherData == NULL)
                            {
                                free(wpt);
                                free(trk);
                                xmlFreeDoc(doc);
                                deleteGPXdoc(gpxdoc);
                                return NULL;
                            }
                            wpt->name[0] = '\0';
                            attr = nodechildchild->properties;
                            while (attr)
                            {
                                if (strcmp((char *)attr->name, "lat") == 0)
                                {
                                    xmlChar *value = xmlNodeListGetString(doc, attr->children, 0);
                                    wpt->latitude = strtod((char *)value, NULL);
                                    xmlFree(value);
                                }
                                else if (strcmp((char *)attr->name, "lon") == 0)
                                {
                                    xmlChar *value = xmlNodeListGetString(doc, attr->children, 0);
                                    wpt->longitude = strtod((char *)value, NULL);
                                    xmlFree(value);
                                }
                                attr = attr->next;
                            }

                            insertBack(trkseg->waypoints, wpt);
                        }
                        nodechildchild = nodechildchild->next;
                    }

                    insertBack(trk->segments, trkseg);
                }
                else
                {
                    xmlChar *value = xmlNodeListGetString(doc, nodechild->children, 0);
                    if (value != NULL)
                    {
                        GPXData *data = malloc(sizeof(GPXData) + strlen((char *)value) + 1);
                        if (data == NULL)
                        {
                            free(trk);
                            xmlFree(value);
                            xmlFreeDoc(doc);
                            deleteGPXdoc(gpxdoc);
                            return NULL;
                        }

                        strcpy(data->name,(char *) nodechild->name);
                        strcpy(data->value,(char *) value);
                        insertBack(trk->otherData, data);
                        xmlFree(value);
                    }
                }

                nodechild = nodechild->next; 
            }

            if (gotName == 0)
            {
                trk->name = malloc(1);
                if (trk->name == NULL)
                {
                    free(trk);
                    xmlFreeDoc(doc);
                    deleteGPXdoc(gpxdoc);
                    return NULL;
                }
                trk->name[0] = '\0';
            }

            insertBack(gpxdoc->tracks, trk);
        }
        else if (strcmp((char *)node->name, "rte") == 0)
        {
            Route *rt = malloc(sizeof(Route));
            if (rt == NULL)
            {
                xmlFreeDoc(doc);
                deleteGPXdoc(gpxdoc);
                return NULL;
            }
            rt->otherData = initializeList(gpxDataToString, deleteGpxData, compareGpxData);
            rt->waypoints = initializeList(waypointToString, deleteWaypoint, compareWaypoints);
            if (rt->otherData == NULL || rt->waypoints == NULL)
            {
                free(rt);
                xmlFreeDoc(doc);
                deleteGPXdoc(gpxdoc);
                return NULL;
            }

            int gotName = 0;
            xmlNodePtr nodechild = node->children;
            while (nodechild)
            {
                if (strcmp((char *)nodechild->name, "name") == 0)
                {
                    xmlChar *value = xmlNodeListGetString(doc, nodechild->children, 0);
                    rt->name = malloc(strlen((char *)value) + 1);
                    if (rt->name == NULL)
                    {
                        free(rt);
                        xmlFreeDoc(doc);
                        deleteGPXdoc(gpxdoc);
                        return NULL;
                    }
                    strcpy(rt->name, (char *)value);
                    xmlFree(value);
                    gotName = 1;
                }
                else if (strcmp((char *)nodechild->name, "rtept") == 0)
                {
                    Waypoint *wpt = malloc(sizeof(Waypoint));
                    if (wpt == NULL)
                    {
                        free(rt);
                        xmlFreeDoc(doc);
                        deleteGPXdoc(gpxdoc);
                        return NULL;
                    }
                    
                    wpt->name = malloc(1);
                    wpt->otherData = initializeList(waypointToString, deleteWaypoint, compareWaypoints);
                    if (wpt->name == NULL || wpt->otherData == NULL)
                    {
                        free(wpt);
                        free(rt);
                        xmlFreeDoc(doc);
                        deleteGPXdoc(gpxdoc);
                        return NULL;
                    }
                    wpt->name[0] = '\0';
                    attr = nodechild->properties;
                    while (attr)
                    {
                        if (strcmp((char *)attr->name, "lat") == 0)
                        {
                            xmlChar *value = xmlNodeListGetString(doc, attr->children, 0);
                            wpt->latitude = strtod((char *)value, NULL);
                            xmlFree(value);
                        }
                        else if (strcmp((char *)attr->name, "lon") == 0)
                        {
                            xmlChar *value = xmlNodeListGetString(doc, attr->children, 0);
                            wpt->longitude = strtod((char *)value, NULL);
                            xmlFree(value);
                        }
                        attr = attr->next;
                    }

                    insertBack(rt->waypoints, wpt);
                }
                else
                {
                    xmlChar *value = xmlNodeListGetString(doc, nodechild->children, 0);
                    if (value != NULL)
                    {
                        GPXData *data = malloc(sizeof(GPXData) + strlen((char *)value) + 1);
                        if (data == NULL)
                        {
                            free(rt);
                            xmlFree(value);
                            xmlFreeDoc(doc);
                            deleteGPXdoc(gpxdoc);
                            return NULL;
                        }

                        strcpy(data->name,(char *) nodechild->name);
                        strcpy(data->value,(char *) value);
                        insertBack(rt->otherData, data);
                        xmlFree(value);
                    }
                }

                nodechild = nodechild->next;
            }

            if (gotName == 0)
            {
                rt->name = malloc(1);
                if (rt->name == NULL)
                {
                    free(rt);
                    xmlFreeDoc(doc);
                    deleteGPXdoc(gpxdoc);
                    return NULL;
                }

                rt->name[0] = '\0';
            }

            insertBack(gpxdoc->routes, rt);
        }
        node = node->next;
    }

    xmlFreeDoc(doc);
    return gpxdoc;
}

char* GPXdocToString(GPXdoc* doc)
{
    if (doc == NULL) return NULL;
    
    char *first_data = toString(doc->waypoints);
    char *second_data = toString(doc->waypoints);
    char *third_data = toString(doc->routes);
    char *result = malloc(strlen(first_data) + strlen(second_data) + strlen(third_data) + 512 + 1);
    if (result == NULL)
    {
        free(first_data);
        free(second_data);
        free(third_data);
        return NULL;
    }

    sprintf(result, "<gpx creator=\"%s\" version=\"%lf\" xmlns=\"%s\">%s\n%s\n%s</gpx>", doc->creator, doc->version, doc->namespace, first_data, second_data, third_data);
    free(first_data);
    free(second_data);
    free(third_data);
    return result;
}

void deleteGPXdoc(GPXdoc* doc)
{
    if (doc == NULL) return;
    
    if (doc->creator != NULL) free(doc->creator);
    if (doc->routes != NULL) freeList(doc->routes);
    if (doc->tracks != NULL) freeList(doc->tracks);
    if (doc->waypoints != NULL) freeList(doc->waypoints);
    free(doc);
}

int getNumWaypoints(const GPXdoc* doc)
{
    if (doc == NULL) return 0;
    
    return getLength(doc->waypoints);
}

int getNumRoutes(const GPXdoc* doc)
{
    if (doc == NULL) return 0;
    
    return getLength(doc->routes);
}

int getNumTracks(const GPXdoc* doc)
{
    if (doc == NULL) return 0;
    
    return getLength(doc->tracks);
}

int getNumSegments(const GPXdoc* doc)
{
    if (doc == NULL) return 0;
    
    int result = 0;
    Track *trk;
    ListIterator it = createIterator(doc->tracks);
    while ((trk = nextElement(&it)))
    {
        result += getLength(trk->segments);
    }

    return result;
}

int getNumGPXData(const GPXdoc* doc)
{
    if (doc == NULL) return 0;

    int result = 0;
    Waypoint *wpt;
    ListIterator it = createIterator(doc->waypoints);
    while ((wpt = nextElement(&it)))
    {
        if (wpt->name && strcmp((char *)wpt->name, "") != 0) result += 1;
        result += getLength(wpt->otherData);
    }

    Track *trk;
    it = createIterator(doc->tracks);
    while ((trk = nextElement(&it)))
    {
        if (trk->name && strcmp((char *)trk->name, "") != 0) result += 1;
        result += getLength(trk->otherData);
    }

    Route *rt;
    it = createIterator(doc->routes);
    while ((rt = nextElement(&it)))
    {
        if (rt->name && strcmp((char *)rt->name, "") != 0) result += 1;
        result += getLength(rt->otherData);
    }

    return result;
}

Waypoint* getWaypoint(const GPXdoc* doc, char* name)
{
    if (doc == NULL || name == NULL) return NULL;

    Waypoint *wpt;
    ListIterator it = createIterator(doc->waypoints);
    while ((wpt = nextElement(&it)))
    {
        if (strcmp(wpt->name, name) == 0) return wpt;
    }

    return NULL;
}

Track* getTrack(const GPXdoc* doc, char* name)
{
    if (doc == NULL || name == NULL) return NULL;
    
    Track *trk;
    ListIterator it = createIterator(doc->tracks);
    while ((trk = nextElement(&it)))
    {
        if (strcmp(trk->name, name) == 0) return trk;
    }

    return NULL;
}

Route* getRoute(const GPXdoc* doc, char* name)
{
    if (doc == NULL || name == NULL) return NULL;
    
    Route *rt;
    ListIterator it = createIterator(doc->routes);
    while ((rt = nextElement(&it)))
    {
        if (strcmp(rt->name, name) == 0) return rt;
    }

    return NULL;
}

void deleteGpxData( void* data)
{
    free(data);
}

char* gpxDataToString( void* data)
{
    const GPXData *ptr = data;
    char *result = malloc(strlen(ptr->name) * 2 + strlen(ptr->value) + 1 + 2 + 2 + 1);
    if (result == NULL) return NULL;
    sprintf(result, "<%s>%s</%s>", ptr->name, ptr->value, ptr->name);
    return result;
}

int compareGpxData(const void *first, const void *second)
{
    const GPXData *f = first;
    const GPXData *s = second;
    return strcmp(f->name, s->name);
}

void deleteWaypoint(void* data)
{
    Waypoint *wpt = data;
    free(wpt->name);
    freeList(wpt->otherData);
    free(wpt);
}

char* waypointToString(void* data)
{
    Waypoint *wpt = data;
    char *gpx_data = toString(wpt->otherData);
    if (gpx_data == NULL) return NULL;

    char *result = malloc(256 + strlen(wpt->name) + 32 + 32 + strlen(gpx_data) + 1 + 1);
    if (result == NULL)
    {
        free(gpx_data);
        return NULL;
    }
    sprintf(result, "<wpt lat=\"%lf\" lon=\"%lf\">\n<name>%s</name>%s\n</wpt>\n", wpt->latitude, wpt->longitude, wpt->name, gpx_data);
    free(gpx_data);
    return result;
}

int compareWaypoints(const void *first, const void *second)
{
    const Waypoint *f = first, *s = second;
    return strcmp(f->name, s->name);
}

void deleteRoute(void* data)
{
    Route *rt = data;
    if (rt->name != NULL) free(rt->name);
    if (rt->otherData != NULL) freeList(rt->otherData);
    if (rt->waypoints != NULL) freeList(rt->waypoints);
    free(rt);
}
char* routeToString(void* data)
{
    const Route *trk = data;
    char *first_data = toString(trk->otherData);
    char *second_data = toString(trk->waypoints);
    char *result = malloc(strlen(first_data) + strlen(second_data) + 256 + 1);
    if (result == NULL)
    {
        free(first_data);
        free(second_data);
        return NULL;
    }

    sprintf(result, "<rte>\n<name>%s</name>%s\n%s\n</rte>", trk->name, first_data, second_data);
    free(first_data);
    free(second_data);
    return result;
}
int compareRoutes(const void *first, const void *second)
{
    const Route *f = first, *s = second;
    return strcmp(f->name, s->name);
}

void deleteTrackSegment(void* data)
{
    TrackSegment *trkseg = data;
    if (trkseg->waypoints != NULL) freeList(trkseg->waypoints);
    free(data);
}
char* trackSegmentToString(void* data)
{
    const TrackSegment *trkseg = data;
    return toString(trkseg->waypoints);
}
int compareTrackSegments(const void *first, const void *second)
{
    const TrackSegment *f = first, *s = second;
    return getLength(f->waypoints) - getLength(s->waypoints);
}

void deleteTrack(void* data)
{
    Track *trk = data;
    if (trk->name != NULL) free(trk->name);
    if (trk->otherData) freeList(trk->otherData);
    if (trk->segments) freeList(trk->segments);
    free(trk);
}
char* trackToString(void* data)
{
    const Track *trk = data;
    char *first_data = toString(trk->otherData);
    char *second_data = toString(trk->segments);
    char *result = malloc(strlen(first_data) + strlen(second_data) + 256 + 1);
    if (result == NULL)
    {
        free(first_data);
        free(second_data);
        return NULL;
    }

    sprintf(result, "<trk>\n<name>%s</name>\n<trkseg>%s</trkseg>\n%s\n</trk>", trk->name, second_data, first_data);
    free(first_data);
    free(second_data);
    return result;
}
int compareTracks(const void *first, const void *second)
{
    const Track *f = first, *s = second;
    return strcmp(f->name, s->name);
}

GPXdoc* createValidGPXdoc(char* fileName, char* gpxSchemaFile)
{
  if (fileName == NULL || strlen(fileName) == 0) return NULL;

  if (gpxSchemaFile == NULL || strlen(gpxSchemaFile) == 0) return createGPXdoc(fileName);
  xmlSchemaParserCtxtPtr ctxt = xmlSchemaNewParserCtxt(gpxSchemaFile);
  if (ctxt == NULL) return NULL;

  xmlSchemaPtr schema = xmlSchemaParse(ctxt);
  if (schema == NULL)
  {
    xmlSchemaFreeParserCtxt(ctxt);
    return NULL;
  }

  xmlSchemaValidCtxtPtr valid_ctxt = xmlSchemaNewValidCtxt(schema);
  if (valid_ctxt == NULL)
  {
    xmlSchemaFree(schema);
    return NULL;
  }

  xmlDocPtr doc = xmlReadFile(fileName, NULL, 0);
  if (doc == NULL)
  {
    xmlSchemaFreeValidCtxt(valid_ctxt);
    return NULL;
  }


  if (xmlSchemaValidateDoc(valid_ctxt, doc) != 0)
  {
    xmlSchemaFreeValidCtxt(valid_ctxt);
    xmlFreeDoc(doc);
    return NULL;
  }

  xmlSchemaFreeValidCtxt(valid_ctxt);
  xmlFreeDoc(doc);
  return createGPXdoc(fileName);
}

bool validateGPXDoc(GPXdoc* doc, char* gpxSchemaFile)
{
  return false;
}

bool writeGPXdoc(GPXdoc* doc, char* fileName)
{
  char *str = GPXdocToString(doc);
  if (str == NULL) return false;

  FILE *f = fopen(fileName, "wb");
  fwrite(str, 1, strlen(str), f);
  fclose(f);
  free(str);
  return true;
}

float harversineFormula(double lat1, double long1, double lat2, double long2)
{
  double R = 6371e3;
  double convertedLat1 = (M_PI / 180.0) * lat1;
  double convertedLat2 = (M_PI / 180.0) * lat2;
  double differenceLat = (lat2 - lat1) * M_PI / 180.0;
  double differenceLong = (long2 - long1) * M_PI / 180.0;

  double a = sin(differenceLat / 2.0) * sin(differenceLat / 2.0) + cos(convertedLat2) * cos(convertedLat1) * sin(differenceLong / 2.0) * sin(differenceLong / 2.0);
  double c = 2 * atan2(sqrt(a), sqrt(1-a));
  double d = R * c;
  return (float)d;
}

float getRouteLenList(List *waypoint_list)
{
  double len = 0;
  ListIterator it = createIterator(waypoint_list);
  Waypoint *current, *previous = NULL;
  while ((current = nextElement(&it)) != NULL)
  {
    if (previous != NULL)
    {
      len += harversineFormula(previous->latitude, previous->longitude, current->latitude, current->longitude);
    }
    previous = current;
  }
  return (float)len;
}

float getRouteLen(const Route *rt)
{
  if (rt == NULL) return 0;

  float len = getRouteLenList(rt->waypoints);
  freeList(rt->otherData);
  freeList(rt->waypoints);
  free(rt->name);
  return (float)len;
}

Waypoint *getLast(List *waypoint_list)
{
  ListIterator it = createIterator(waypoint_list);
  Waypoint *current, *previous = NULL;
  while ((current = nextElement(&it)) != NULL)
  {
    previous = current;
  }
  return previous;
}

Waypoint *getFirst(List *waypoint_list)
{
  ListIterator it = createIterator(waypoint_list);
  return nextElement(&it);
}

float getTrackLen(const Track *tr)
{
  if (tr == NULL) return 0;
  float len = 0;

  ListIterator it = createIterator(tr->segments);
  TrackSegment *current, *previous = NULL;
  while ((current = nextElement(&it)) != NULL)
  {
    if (previous != NULL)
    {
      Waypoint *last = getLast(previous->waypoints);
      Waypoint *first = getFirst(current->waypoints);
      len += harversineFormula(last->latitude, last->longitude, first->latitude, first->longitude);
    }
    len += getRouteLenList(current->waypoints);
    previous = current;
  }
  freeList(tr->segments);
  freeList(tr->otherData);
  free(tr->name);
  return len;
}

float round10(float len)
{
  return ((float)roundf(len / 10.0f) * 10.0f);
}

int numRoutesWithLength(const GPXdoc* doc, float len, float delta)
{
  if (doc == NULL || len < 0 || delta < 0) return 0;

  int num_routes = 0;
  Route *current;
  ListIterator it = createIterator(doc->routes);

  while ((current = nextElement(&it)) != NULL)
  {
    float r_len = getRouteLenList(current->waypoints);
    if (r_len >= len - delta && r_len <= len + delta)
    {
      num_routes++;
    }
  }

  return num_routes;
}

int numTracksWithLength(const GPXdoc* doc, float len, float delta)
{
  if (doc == NULL || len < 0 || delta < 0) return 0;

  int num_tracks = 0;
  Track *current;
  ListIterator it = createIterator(doc->tracks);
  while ((current = nextElement(&it)) != NULL)
  {
    float t_len = 0;
    TrackSegment *current_ts;
    ListIterator an_it = createIterator(current->segments);
    while ((current_ts = nextElement(&an_it)) != NULL)
    {
      len += getRouteLenList(current_ts->waypoints);
    }

    if (t_len >= len - delta && t_len <= len + delta)
    {
      num_tracks++;
    }
  }

  return num_tracks;
}

bool isLoopRoute(const Route* route, float delta)
{
  if (route == NULL || delta < 0) return false;

  int num_wp = 0;
  ListIterator it = createIterator(route->waypoints);
  while (nextElement(&it) != NULL) num_wp++;
  if (num_wp < 4) return false;

  Waypoint *first = getFirst(route->waypoints);
  Waypoint *last = getLast(route->waypoints);

  float len = harversineFormula(last->latitude, last->longitude, first->latitude, first->longitude);
  if (len <= delta) return true;
  return false;
}

bool isLoopTrack(const Track *tr, float delta)
{
  if (tr == NULL || delta < 0) return false;

  int num_wp = 0;
  Waypoint *first, *last, *previous = NULL;
  int is_first = 1;

  TrackSegment *current;
  ListIterator it = createIterator(tr->segments);
  while ((current = nextElement(&it)) != NULL)
  {
    Waypoint *wp;
    ListIterator an_it = createIterator(current->waypoints);
    while ((wp = nextElement(&an_it)) != NULL)
    {
      if (is_first)
      {
        first = wp;
        is_first = 0;
      }

      previous = wp;
      num_wp++;
    }
  }

  if (num_wp < 4) return false;

  last = previous;
  float len = harversineFormula(last->latitude, last->longitude, first->latitude, first->longitude);
  if (len <= delta) return true;
  return false;
}

List* getRoutesBetween(const GPXdoc* doc, float sourceLat, float sourceLong, float destLat, float destLong, float delta)
{
  return NULL;
}

List* getTracksBetween(const GPXdoc* doc, float sourceLat, float sourceLong, float destLat, float destLong, float delta)
{
  return NULL;
}

char* trackToJSON(const Track *tr)
{
  return NULL;
}

char* routeToJSON(const Route *rt)
{
  return NULL;
}

char* routeListToJSON(const List *list)
{
  return NULL;
}

char* trackListToJSON(const List *list)
{
  return NULL;
}

char* GPXtoJSON(const GPXdoc* gpx)
{
  return NULL;
}

void addWaypoint(Route *rt, Waypoint *pt)
{

}

void addRoute(GPXdoc* doc, Route* rt)
{

}

GPXdoc* JSONtoGPX(const char* gpxString)
{
  return NULL;
}

Waypoint* JSONtoWaypoint(const char* gpxString)
{
  return NULL;
}

Route* JSONtoRoute(const char* gpxString)
{
  return NULL;
}

