using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LibraryApi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Biography",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Fantasy",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Fiction",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "History",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Mystery",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Non-Fiction",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Romance",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Science",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Self-Help",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Technology",
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Biography",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1046));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Fantasy",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1050));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Fiction",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(923));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "History",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1047));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Mystery",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1049));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Non-Fiction",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1043));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Romance",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1048));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Science",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1045));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Self-Help",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1051));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Name",
                keyValue: "Technology",
                column: "CreatedAt",
                value: new DateTime(2025, 9, 3, 20, 25, 17, 942, DateTimeKind.Utc).AddTicks(1046));
        }
    }
}
