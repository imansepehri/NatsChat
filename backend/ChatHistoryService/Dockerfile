FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5001

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/ChatHistoryService/ChatHistoryService.csproj backend/ChatHistoryService/
COPY protos/ protos/
RUN dotnet restore backend/ChatHistoryService/ChatHistoryService.csproj
COPY backend/ChatHistoryService/ backend/ChatHistoryService/
WORKDIR /src/backend/ChatHistoryService
RUN dotnet publish -c Release -o /out

FROM base AS final
WORKDIR /app
COPY --from=build /out .
ENTRYPOINT ["dotnet", "ChatHistoryService.dll"]


